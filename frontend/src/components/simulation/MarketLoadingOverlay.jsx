import { useMarketStore } from '../../store/marketStore';

export default function MarketLoadingOverlay() {
  const isLoading    = useMarketStore((s) => s.isLoading);
  const initProgress = useMarketStore((s) => s.initProgress);

  if (!isLoading) return null;

  const pct    = initProgress ? Math.round((initProgress.current / initProgress.total) * 100) : 0;
  const phase  = initProgress?.phase;
  const label  = phase === 'generate' ? 'Generating history' : phase === 'gap-fill' ? 'Filling gap' : 'Checking';

  return (
    <div className="mlo-overlay">
      <div className="mlo-box">
        <div className="mlo-spinner" />
        <h2 className="mlo-title">Building Market History</h2>
        <p className="mlo-sub">
          Generating 1 year of simulated price data for all 30 tickers.
          This only happens on first run — subsequent starts are instant.
        </p>

        {initProgress ? (
          <>
            <div className="mlo-stock-row">
              <span className="mlo-badge">{label}</span>
              <span className="mlo-stock">{initProgress.stock}</span>
              <span className="mlo-count">{initProgress.current} / {initProgress.total}</span>
            </div>
            <div className="mlo-track">
              <div className="mlo-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="mlo-pct">{pct}%</p>
          </>
        ) : (
          <p className="mlo-wait">Connecting to market data stream…</p>
        )}
      </div>
    </div>
  );
}
