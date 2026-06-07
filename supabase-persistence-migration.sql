-- ============================================
-- SoictStock persistence migration
-- Adds normalized orders/assets/snapshots and leaderboard query source.
-- Run this once in the Supabase SQL Editor.
-- ============================================

CREATE TABLE IF NOT EXISTS portfolio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  shares NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  realized_pl NUMERIC NOT NULL DEFAULT 0,
  market_price NUMERIC NOT NULL DEFAULT 0,
  market_value NUMERIC NOT NULL DEFAULT 0,
  unrealized_pl NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_value NUMERIC NOT NULL,
  cash NUMERIC NOT NULL,
  stock_value NUMERIC NOT NULL,
  total_return NUMERIC NOT NULL,
  holdings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell')),
  ticker TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'Market',
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Filled', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assets" ON portfolio_assets;
DROP POLICY IF EXISTS "Users can update own assets" ON portfolio_assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON portfolio_assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON portfolio_assets;
CREATE POLICY "Users can view own assets" ON portfolio_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON portfolio_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON portfolio_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON portfolio_assets FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON portfolio_snapshots;
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.portfolios (user_id, cash, initial_cash, holdings)
  VALUES (NEW.id, 150000, 150000, '{}')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.watchlists (user_id, tickers)
  VALUES (NEW.id, ARRAY['SCT', 'INNO', 'NXTG', 'HEAL', 'GRN'])
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.leaderboard_entries (user_id, display_name, portfolio_value, total_return, sharpe_ratio, trades_count, period)
  VALUES
    (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 150000, 0, 0, 0, 'daily'),
    (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 150000, 0, 0, 0, 'weekly'),
    (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 150000, 0, 0, 0, 'monthly'),
    (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 150000, 0, 0, 0, 'all-time')
  ON CONFLICT (user_id, period) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW public.leaderboard_source AS
WITH latest_snapshots AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    portfolio_value,
    total_return,
    created_at
  FROM public.portfolio_snapshots
  ORDER BY user_id, created_at DESC
),
trade_counts AS (
  SELECT user_id, COUNT(*)::INTEGER AS trades_count
  FROM public.transactions
  GROUP BY user_id
)
SELECT
  p.id AS user_id,
  p.display_name,
  COALESCE(s.portfolio_value, pf.cash, 150000) AS portfolio_value,
  COALESCE(s.total_return, 0) AS total_return,
  COALESCE(t.trades_count, 0) AS trades_count,
  COALESCE(s.created_at, pf.updated_at, p.updated_at) AS updated_at
FROM public.user_profiles p
LEFT JOIN public.portfolios pf ON pf.user_id = p.id
LEFT JOIN latest_snapshots s ON s.user_id = p.id
LEFT JOIN trade_counts t ON t.user_id = p.id;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_entries()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.leaderboard_entries (
    user_id,
    display_name,
    portfolio_value,
    total_return,
    sharpe_ratio,
    trades_count,
    period,
    updated_at
  )
  SELECT
    src.user_id,
    src.display_name,
    src.portfolio_value,
    src.total_return,
    0,
    src.trades_count,
    period_name,
    NOW()
  FROM public.leaderboard_source src
  CROSS JOIN (VALUES ('daily'), ('weekly'), ('monthly'), ('all-time')) AS periods(period_name)
  ON CONFLICT (user_id, period) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    portfolio_value = EXCLUDED.portfolio_value,
    total_return = EXCLUDED.total_return,
    trades_count = EXCLUDED.trades_count,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_user ON portfolio_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_created ON portfolio_snapshots(user_id, created_at DESC);

SELECT public.refresh_leaderboard_entries();
