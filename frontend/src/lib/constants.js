/* Stock configurations */
export const STOCKS = [
  { ticker: 'SCT', name: 'SCTech Ltd.', fullName: 'SC Technologies Limited', sector: 'Technology', color: '#1B3BFC', basePrice: 128.45, drift: 0.0008, volatility: 0.025 },
  { ticker: 'INNO', name: 'InnoVance', fullName: 'InnoVance Corporation', sector: 'Technology', color: '#8B5CF6', basePrice: 95.20, drift: 0.0006, volatility: 0.022 },
  { ticker: 'NXTG', name: 'NextGen Corp', fullName: 'NextGen Corporation', sector: 'Technology', color: '#06B6D4', basePrice: 210.75, drift: 0.0005, volatility: 0.028 },
  { ticker: 'HEAL', name: 'HealthAxis', fullName: 'HealthAxis Inc.', sector: 'Healthcare', color: '#10B981', basePrice: 78.30, drift: 0.0003, volatility: 0.018 },
  { ticker: 'GRN', name: 'GreenFuture', fullName: 'GreenFuture Energy', sector: 'Energy', color: '#22C55E', basePrice: 45.60, drift: 0.0007, volatility: 0.032 },
  { ticker: 'TECH', name: 'TechVault', fullName: 'TechVault Industries', sector: 'Technology', color: '#F59E0B', basePrice: 315.80, drift: 0.0004, volatility: 0.020 },
  { ticker: 'FINI', name: 'FinIntel', fullName: 'Financial Intelligence Corp', sector: 'Finance', color: '#EC4899', basePrice: 162.40, drift: 0.0005, volatility: 0.019 },
];

export const INITIAL_CASH = 150000;

export const ORDER_TYPES = ['Market', 'Limit', 'Stop-Loss'];

export const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'All'];

export const MARKET_REGIMES = {
  bull: { name: 'Bull Market', drift: 0.001, volatilityMult: 0.8, color: '#22C55E' },
  bear: { name: 'Bear Market', drift: -0.001, volatilityMult: 1.2, color: '#EF4444' },
  sideways: { name: 'Sideways', drift: 0, volatilityMult: 1.5, color: '#F59E0B' },
};

export const SCENARIOS = [
  {
    id: 'crisis_2008',
    name: '2008 Financial Crisis',
    description: 'Experience the sharp market crash and slow recovery of the 2008 financial crisis. Banks collapse, credit freezes, and stocks plummet.',
    duration: '6 months simulated',
    difficulty: 'Hard',
    phases: [
      { duration: 30, drift: -0.003, volatilityMult: 2.5 },
      { duration: 60, drift: -0.001, volatilityMult: 1.8 },
      { duration: 90, drift: 0.0005, volatilityMult: 1.3 },
    ],
  },
  {
    id: 'tech_bubble',
    name: '2000 Tech Bubble',
    description: 'Tech stocks pump to unsustainable levels then collapse dramatically. TECH and SCT stocks are most affected.',
    duration: '4 months simulated',
    difficulty: 'Medium',
    phases: [
      { duration: 30, drift: 0.004, volatilityMult: 1.5, sectors: ['Technology'] },
      { duration: 15, drift: -0.006, volatilityMult: 3.0, sectors: ['Technology'] },
      { duration: 45, drift: -0.001, volatilityMult: 1.5 },
    ],
  },
  {
    id: 'covid_2020',
    name: 'COVID March 2020',
    description: 'Instant -35% crash followed by a V-shaped recovery driven by stimulus and tech adoption.',
    duration: '3 months simulated',
    difficulty: 'Medium',
    phases: [
      { duration: 10, drift: -0.008, volatilityMult: 4.0 },
      { duration: 20, drift: 0.004, volatilityMult: 2.0 },
      { duration: 30, drift: 0.002, volatilityMult: 1.2 },
    ],
  },
  {
    id: 'inflation',
    name: 'High Inflation',
    description: 'Bond yields spike and growth stocks fall. Value and energy stocks outperform.',
    duration: '4 months simulated',
    difficulty: 'Easy',
    phases: [
      { duration: 60, drift: -0.0005, volatilityMult: 1.3, sectors: ['Technology'] },
      { duration: 60, drift: 0.001, volatilityMult: 0.9, sectors: ['Energy', 'Finance'] },
    ],
  },
];

export const NEWS_TEMPLATES = [
  { type: 'earnings_positive', headline: '{company} Reports Record Q4 Earnings, Beats Estimates by 15%', impact: [0.05, 0.15], sentiment: 'positive' },
  { type: 'earnings_negative', headline: '{company} Misses Revenue Expectations, Shares Under Pressure', impact: [-0.05, -0.15], sentiment: 'negative' },
  { type: 'fed_rate_hike', headline: 'Federal Reserve Raises Interest Rates by 25 Basis Points', impact: [-0.02, -0.05], sentiment: 'negative', sectorWide: true },
  { type: 'fed_rate_cut', headline: 'Fed Cuts Rates in Surprise Move, Markets Rally', impact: [0.02, 0.05], sentiment: 'positive', sectorWide: true },
  { type: 'product_launch', headline: '{company} Unveils Revolutionary AI Platform, Analysts Upgrade', impact: [0.03, 0.08], sentiment: 'positive' },
  { type: 'ceo_departure', headline: '{company} CEO Steps Down Amid Board Disagreements', impact: [-0.03, -0.08], sentiment: 'negative' },
  { type: 'merger', headline: '{company} Announces Strategic Merger, Creating Industry Giant', impact: [0.04, 0.12], sentiment: 'positive' },
  { type: 'black_swan', headline: 'BREAKING: Global Supply Chain Crisis Triggers Market Selloff', impact: [-0.15, -0.25], sentiment: 'negative', sectorWide: true },
  { type: 'regulation', headline: 'New Regulatory Framework Benefits {company} Market Position', impact: [0.02, 0.06], sentiment: 'positive' },
  { type: 'analyst_upgrade', headline: 'Goldman Sachs Upgrades {company} to Strong Buy, PT $200', impact: [0.02, 0.05], sentiment: 'positive' },
];

export const BADGES = [
  { id: 'first_trade', name: 'First Steps', description: 'Complete your first trade', icon: '🎯', requirement: 'trades >= 1' },
  { id: 'top_trader', name: 'Top Trader', description: 'Achieve top 10 on the leaderboard', icon: '🏆', requirement: 'rank <= 10' },
  { id: 'risk_master', name: 'Risk Master', description: 'Maintain a Sharpe ratio above 1.5', icon: '🛡️', requirement: 'sharpe >= 1.5' },
  { id: 'bear_survivor', name: 'Bear Survivor', description: 'Profit during a bear market scenario', icon: '🐻', requirement: 'profitInBear' },
  { id: 'diversified', name: 'Diversified', description: 'Hold 5+ different stocks', icon: '🎨', requirement: 'holdings >= 5' },
  { id: 'profit_streak', name: 'Hot Streak', description: '5 profitable trades in a row', icon: '🔥', requirement: 'profitStreak >= 5' },
  { id: 'value_investor', name: 'Value Hunter', description: 'Buy a stock that rises 10%+ within a week', icon: '💎', requirement: 'bestGain >= 0.1' },
  { id: 'century_club', name: 'Century Club', description: 'Complete 100 trades', icon: '💯', requirement: 'trades >= 100' },
];

export const ADVISOR_MODES = [
  { id: 'trend', name: 'Trend Following', description: 'Follow momentum and market trends', icon: '📈' },
  { id: 'mean_reversion', name: 'Mean Reversion', description: 'Buy dips and sell rallies', icon: '🔄' },
  { id: 'value', name: 'Value Investing', description: 'Focus on undervalued opportunities', icon: '💰' },
];

export const TICKER_COLORS = {
  SCT: '#1B3BFC',
  INNO: '#8B5CF6',
  NXTG: '#06B6D4',
  HEAL: '#10B981',
  GRN: '#22C55E',
  TECH: '#F59E0B',
  FINI: '#EC4899',
};
