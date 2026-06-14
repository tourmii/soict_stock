/* Stock configurations — 12 fictional tickers, 2 per sector */
export const STOCKS = [
  // ── Technology ──────────────────────────────
  { ticker: 'SCT',  name: 'SCTech Ltd.',   fullName: 'SC Technologies Limited',    sector: 'Technology', color: '#1B3BFC', basePrice: 128.45, drift: 0.0008, volatility: 0.025 },
  { ticker: 'INNO', name: 'InnoVance',     fullName: 'InnoVance Corporation',      sector: 'Technology', color: '#8B5CF6', basePrice: 95.20,  drift: 0.0006, volatility: 0.022 },

  // ── Healthcare ──────────────────────────────
  { ticker: 'HEAL', name: 'HealthAxis',    fullName: 'HealthAxis Inc.',            sector: 'Healthcare', color: '#10B981', basePrice: 78.30,  drift: 0.0003, volatility: 0.018 },
  { ticker: 'BPHR', name: 'BioPharma',     fullName: 'BioPharma Research Ltd.',   sector: 'Healthcare', color: '#14B8A6', basePrice: 134.60, drift: 0.0005, volatility: 0.024 },

  // ── Energy ──────────────────────────────────
  { ticker: 'GRN',  name: 'GreenFuture',   fullName: 'GreenFuture Energy',        sector: 'Energy',     color: '#22C55E', basePrice: 45.60,  drift: 0.0007, volatility: 0.032 },
  { ticker: 'SLRX', name: 'SolaraX',       fullName: 'SolaraX Renewable Corp.',   sector: 'Energy',     color: '#FACC15', basePrice: 68.20,  drift: 0.0008, volatility: 0.035 },

  // ── Finance ──────────────────────────────────
  { ticker: 'FINI', name: 'FinIntel',      fullName: 'Financial Intelligence Corp', sector: 'Finance',  color: '#EC4899', basePrice: 162.40, drift: 0.0005, volatility: 0.019 },
  { ticker: 'BKGR', name: 'BankGrowth',    fullName: 'BankGrowth Holdings',       sector: 'Finance',    color: '#F472B6', basePrice: 88.60,  drift: 0.0003, volatility: 0.017 },

  // ── Consumer ─────────────────────────────────
  { ticker: 'LUXR', name: 'LuxeRetail',    fullName: 'LuxeRetail Group',          sector: 'Consumer',   color: '#D946EF', basePrice: 193.20, drift: 0.0004, volatility: 0.019 },
  { ticker: 'STRM', name: 'StreamMax',     fullName: 'StreamMax Entertainment',   sector: 'Consumer',   color: '#E879F9', basePrice: 118.50, drift: 0.0007, volatility: 0.026 },

  // ── Industrial ───────────────────────────────
  { ticker: 'AROX', name: 'AeroX',         fullName: 'AeroX Defense Systems',     sector: 'Industrial', color: '#F97316', basePrice: 278.40, drift: 0.0005, volatility: 0.022 },
  { ticker: 'CNST', name: 'ConstraPro',    fullName: 'ConstraPro Infrastructure', sector: 'Industrial', color: '#FB923C', basePrice: 95.60,  drift: 0.0003, volatility: 0.018 },
];

export const INITIAL_CASH = 150000;

export const ORDER_TYPES = ['Market', 'Limit', 'Stop-Loss'];

export const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W', '1M'];

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
  // ── Earnings ───────────────────────────────────────────────────────────────
  {
    type: 'earnings_positive',
    headline: '{company} Beats {quarter} Earnings Estimates by {beatPct}%, Raises Full-Year Guidance',
    description: '{fullName} reported earnings per share of ${eps}, beating the analyst consensus by {beatPct}%. Revenue grew {revGrowth}% year-over-year on strong demand across its core {sector} segments. Management raised full-year guidance, citing continued market momentum and improving margins.',
    impact: [0.02, 0.06],
    sentiment: 'positive',
    source: '{analystFirm}',
  },
  {
    type: 'earnings_negative',
    headline: '{company} Misses {quarter} Revenue Forecast, Trims Outlook on Macro Headwinds',
    description: '{fullName} reported quarterly revenue of ${revenue}B, falling short of the ${consensusRevenue}B analyst consensus. Management cited macroeconomic headwinds and softening demand in key markets. The company did not provide updated guidance, adding to investor uncertainty heading into the next quarter.',
    impact: [-0.02, -0.06],
    sentiment: 'negative',
    source: '{analystFirm}',
  },

  // ── Analyst Actions ────────────────────────────────────────────────────────
  {
    type: 'analyst_upgrade',
    headline: '{analystFirm} Upgrades {company} to Buy, Raises Price Target to ${target}',
    description: 'Analysts at {analystFirm} upgraded {fullName} from Neutral to Buy and raised their 12-month price target to ${target}, implying {upside}% upside from current levels. The firm cited improving fundamentals, compelling valuation after a recent pullback, and strong positioning within the {sector} sector.',
    impact: [0.015, 0.04],
    sentiment: 'positive',
    source: '{analystFirm}',
  },
  {
    type: 'analyst_downgrade',
    headline: '{analystFirm} Downgrades {company} to Hold, Cuts PT on Margin Pressure',
    description: '{analystFirm} downgraded {fullName} from Buy to Hold and reduced its price target to ${target}, citing near-term margin compression and slowing growth in the company\'s core {sector} business. The firm noted that near-term risks appear underappreciated at current valuation multiples.',
    impact: [-0.015, -0.04],
    sentiment: 'negative',
    source: '{analystFirm}',
  },

  // ── Corporate Events ───────────────────────────────────────────────────────
  {
    type: 'product_launch',
    headline: '{company} Unveils Next-Gen Platform; {analystFirm} Sees {upside}% Upside',
    description: '{fullName} announced the launch of its next-generation product suite at its annual developer conference. Analysts at {analystFirm} raised their price target to ${target}, citing the platform\'s potential to expand {company}\'s addressable market by an estimated {tamExpansion}%. Shares jumped {beatPct}% in after-hours trading.',
    impact: [0.015, 0.05],
    sentiment: 'positive',
    source: '{analystFirm}',
  },
  {
    type: 'merger',
    headline: '{company} Agrees to ${dealSize}B Merger at {premium}% Premium to Last Close',
    description: '{fullName} announced it has entered into a definitive merger agreement valued at approximately ${dealSize}B, representing a {premium}% premium to the company\'s 30-day volume-weighted average price. The deal is subject to regulatory review and is expected to close within 9–12 months. Analysts say the combination creates meaningful synergies in the {sector} space.',
    impact: [0.03, 0.08],
    sentiment: 'positive',
    source: 'Bloomberg',
  },
  {
    type: 'ceo_departure',
    headline: '{company} CEO Steps Down; Board Launches Nationwide Search for Successor',
    description: '{fullName} announced that its Chief Executive Officer will step down effective at the end of next quarter, following reported strategic disagreements with the board of directors. An interim CEO drawn from the existing board will oversee day-to-day operations while the search is conducted. Analysts say the sudden departure introduces execution risk in a critical period.',
    impact: [-0.02, -0.05],
    sentiment: 'negative',
    source: 'WSJ',
  },
  {
    type: 'buyback',
    headline: '{company} Announces ${dealSize}B Share Buyback Program, Signals Confidence',
    description: '{fullName}\'s board of directors authorized a new share repurchase program of up to ${dealSize}B, representing approximately {premium}% of its current market capitalization. Management said the buyback reflects strong free cash flow generation and conviction in the company\'s long-term growth outlook in the {sector} sector.',
    impact: [0.01, 0.035],
    sentiment: 'positive',
    source: 'Reuters',
  },

  // ── Macro / Fed ────────────────────────────────────────────────────────────
  {
    type: 'fed_rate_hike',
    headline: 'Federal Reserve Raises Rates 25 bps, Signals Data-Dependent Path Ahead',
    description: 'The FOMC voted to raise the federal funds rate by 25 basis points, bringing it to a {years}-year high. Chair Powell emphasized that future decisions will remain data-dependent, and that the committee is prepared to hold rates higher for longer if inflation does not return sustainably to the 2% target. Rate-sensitive sectors sold off on the news.',
    impact: [-0.01, -0.03],
    sentiment: 'negative',
    sectorWide: true,
    source: 'Reuters',
  },
  {
    type: 'fed_rate_cut',
    headline: 'Fed Cuts Rates 25 bps as Inflation Cools, Equity Markets Rally Broadly',
    description: 'The Federal Reserve lowered the federal funds rate by 25 basis points, citing easing inflation and softening labor market conditions. Chair Powell described the move as a recalibration, not a signal of economic weakness. Equity markets surged, with growth and technology stocks leading gains as investors priced in additional cuts later this year.',
    impact: [0.01, 0.03],
    sentiment: 'positive',
    sectorWide: true,
    source: 'Bloomberg',
  },
  {
    type: 'inflation_data',
    headline: 'CPI Cools to {cpi}% — Below Estimates — Fueling Rate-Cut Optimism',
    description: 'The Bureau of Labor Statistics reported that the Consumer Price Index rose {cpi}% year-over-year last month, down from {prevCpi}% in the prior reading and below the {consensusGdp}% economist consensus. Core inflation also moderated. The softer data boosted expectations that the Fed may have room to cut rates earlier than previously anticipated, lifting risk assets broadly.',
    impact: [0.01, 0.025],
    sentiment: 'positive',
    sectorWide: true,
    source: 'CNBC',
  },
  {
    type: 'gdp_miss',
    headline: 'U.S. GDP Grows {gdp}% in Latest Quarter, Missing {consensusGdp}% Consensus',
    description: 'The Bureau of Economic Analysis reported that real GDP grew at an annualized rate of {gdp}% in the latest quarter, falling short of the {consensusGdp}% consensus estimate. Consumer spending showed signs of fatigue while business investment contracted modestly. Economists are divided on whether the miss signals a meaningful growth slowdown or a transitory soft patch.',
    impact: [-0.01, -0.025],
    sentiment: 'negative',
    sectorWide: true,
    source: 'MarketWatch',
  },

  // ── Healthcare Specific ────────────────────────────────────────────────────
  {
    type: 'fda_approval',
    headline: '{company} Wins FDA Approval for Lead Drug, Addressable Market ~{patients}M Patients',
    description: '{fullName} announced that the U.S. Food and Drug Administration has granted approval for its lead drug candidate, clearing the path for a commercial launch next quarter. The treatment targets a condition affecting an estimated {patients} million patients in the U.S. alone. Analysts at {analystFirm} raised their price target to ${target}, calling the approval a pivotal catalyst.',
    impact: [0.03, 0.09],
    sentiment: 'positive',
    sectors: ['Healthcare'],
    source: 'Reuters',
  },
  {
    type: 'clinical_trial_failure',
    headline: '{company} Phase 3 Trial Misses Primary Endpoint; Shares Decline Sharply',
    description: '{fullName} disclosed that its Phase 3 clinical trial for its lead compound failed to meet the primary efficacy endpoint versus placebo. The company said it will review the full dataset with scientific advisors before determining next steps. The drug had been considered the centerpiece of {company}\'s near-term pipeline and a key driver of analyst price targets.',
    impact: [-0.04, -0.10],
    sentiment: 'negative',
    sectors: ['Healthcare'],
    source: 'Bloomberg',
  },

  // ── Energy Specific ────────────────────────────────────────────────────────
  {
    type: 'energy_contract',
    headline: '{company} Lands ${dealSize}B Federal Renewable Energy Contract Spanning {numStates} States',
    description: '{fullName} announced it has been awarded a ${dealSize}B multi-year contract to deliver renewable energy infrastructure to federal facilities across {numStates} states. The agreement is one of the largest in company history and underpins revenue visibility through the next {contractYears} years, significantly expanding the firm\'s project backlog.',
    impact: [0.02, 0.06],
    sentiment: 'positive',
    sectors: ['Energy'],
    source: 'Reuters',
  },

  // ── Technology Specific ────────────────────────────────────────────────────
  {
    type: 'cybersecurity_breach',
    headline: '{company} Discloses Security Breach Potentially Affecting {affectedUsers}M Accounts',
    description: '{fullName} confirmed a cybersecurity incident in which unauthorized third parties gained access to customer data, potentially affecting up to {affectedUsers} million accounts. The company has engaged a leading incident-response firm, notified affected customers, and is cooperating with federal regulators. Analysts warn that regulatory fines and class-action exposure remain difficult to quantify.',
    impact: [-0.025, -0.065],
    sentiment: 'negative',
    sectors: ['Technology', 'Finance'],
    source: 'CNBC',
  },

  // ── Industrial Specific ────────────────────────────────────────────────────
  {
    type: 'defense_contract',
    headline: '{company} Awarded ${dealSize}B Pentagon Contract for Next-Gen Defense Systems',
    description: '{fullName} has been selected by the U.S. Department of Defense to develop and deliver next-generation defense systems under a ${dealSize}B, {contractYears}-year contract. The award significantly expands the company\'s defense program backlog and is expected to provide a stable, long-duration revenue stream. The win is seen as a major competitive victory over rival bidders.',
    impact: [0.025, 0.065],
    sentiment: 'positive',
    sectors: ['Industrial'],
    source: 'Reuters',
  },
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

// Build ticker colors from STOCKS array
export const TICKER_COLORS = {};
for (const stock of STOCKS) {
  TICKER_COLORS[stock.ticker] = stock.color;
}
