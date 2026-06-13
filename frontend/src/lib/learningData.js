/**
 * Learning Center Data: lessons, quizzes, paths, badges, and pattern definitions.
 * Expanded lesson content version.
 */

const simulatorAction = { label: 'Go to Simulator', path: '/simulation' };
const portfolioAction = { label: 'Go to Portfolio', path: '/portfolio' };

export const LESSONS = [
  {
    id: 'market-basics',
    category: 'Fundamentals',
    title: 'How Stock Markets Work',
    difficulty: 'Beginner',
    duration: '14 min',
    icon: 'MB',
    color: '#1B3BFC',
    summary:
      'Understand stock exchanges, listed companies, price discovery, liquidity, and why prices change in the simulator.',
    learningObjectives: [
      'Explain what a stock represents',
      'Describe how buyers and sellers create price discovery',
      'Understand liquidity, bid-ask spread, and market index concepts',
      'Practice a first simulated trade with clear learning goals',
    ],
    content: [
      {
        type: 'text',
        body:
          'A **stock market** is a marketplace where buyers and sellers trade shares of listed companies. In this simulator, stocks are virtual assets, but the learning logic follows the same basic market ideas: ownership, price movement, demand, supply, and risk.',
      },
      {
        type: 'concept',
        title: 'What a Stock Represents',
        body:
          'A stock represents a small ownership claim in a company. In real markets, shareholders may benefit from price appreciation or dividends. In this platform, the stock is simulated, so the purpose is to learn how decisions affect portfolio value.',
      },
      {
        type: 'concept',
        title: 'Listed Company and Ticker',
        body:
          'Each company has a ticker symbol, such as SCT or TECH. The ticker is a short code used to identify the stock quickly in charts, order forms, news, and portfolio tables.',
      },
      {
        type: 'concept',
        title: 'Price Discovery',
        body:
          'Prices change because buyers and sellers disagree about value. If many learners want to buy a stock after positive simulated news, demand increases and price may rise. If selling pressure becomes stronger, price may fall.',
      },
      {
        type: 'concept',
        title: 'Liquidity',
        body:
          'Liquidity means how easily a stock can be traded without large price changes. A highly liquid simulated stock can absorb more buy and sell orders. A less liquid stock may move more sharply when order flow changes.',
      },
      {
        type: 'concept',
        title: 'Bid, Ask, and Spread',
        body:
          'The **bid** is the price buyers are willing to pay. The **ask** is the price sellers want. The difference is the spread. In a simple simulator this may be simplified, but it is useful for understanding why execution price can differ from the last displayed price.',
      },
      {
        type: 'concept',
        title: 'Market Index',
        body:
          'A market index summarizes the movement of a group of stocks. For example, a SoictStock Index can show whether the whole simulated market is trending upward, downward, or sideways.',
      },
      {
        type: 'example',
        title: 'Simple Market Move',
        body:
          'Suppose SCT announces strong simulated quarterly growth. More learners submit buy orders. The pricing engine increases SCT from 100 to 105. This does not mean the stock is always good; it only shows how positive information can affect short-term demand.',
      },
      {
        type: 'scenario',
        title: 'Mini Scenario',
        body:
          'A company releases positive product news, but the whole market index is falling. What should you check before trading?',
        options: ['Only the company news', 'Both company news and market trend', 'Only the ticker color'],
        answer: 'Both company news and market trend',
      },
      {
        type: 'checklist',
        title: 'Before Your First Simulated Trade',
        items: [
          'Read the company name and sector',
          'Check the current price and recent movement',
          'Look at relevant simulated news',
          'Decide how much cash you are willing to use',
          'Write one learning reason for the trade',
        ],
      },
      {
        type: 'tip',
        body:
          'Start small. The purpose of the first simulated trade is not to maximize return, but to understand how orders, cash, holdings, and portfolio value change after execution.',
      },
      {
        type: 'warning',
        title: 'Simulation Boundary',
        body:
          'All market activity here is educational and virtual. Do not treat simulated performance as real investment advice or a real market forecast.',
      },
    ],
    practiceTask: {
      title: 'Place your first simulated trade',
      description:
        'Use the simulator to place at least one practice trade and then review how cash, holdings, and portfolio value changed.',
      type: 'first_trade',
      target: { minTransactions: 1 },
      cta: simulatorAction,
    },
    relatedQuizId: 'basics-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'order-types',
    category: 'Trading Mechanics',
    title: 'Order Types in the Simulator',
    difficulty: 'Beginner',
    duration: '12 min',
    icon: 'OT',
    color: '#06B6D4',
    summary:
      'Learn market, limit, stop-loss, and take-profit orders, including execution priority and practical trade-offs.',
    learningObjectives: [
      'Compare major order types used in the simulator',
      'Understand execution speed versus price control',
      'Recognize why an order may not execute immediately',
      'Use order types as simulated risk-management tools',
    ],
    content: [
      {
        type: 'text',
        body:
          'An **order** is an instruction to buy or sell a stock. Different order types help learners practice different goals: fast execution, price control, risk limitation, or profit-taking discipline.',
      },
      {
        type: 'concept',
        title: 'Market Order',
        body:
          'A market order asks the system to trade immediately at the best available simulated price. It is useful when execution speed matters more than exact price control.',
      },
      {
        type: 'example',
        title: 'Market Order Example',
        body:
          'If SCT is shown near 100 and you submit a market buy order, the trade may execute around the available price. In a more realistic market, the final execution price can differ slightly because prices move and spreads exist.',
      },
      {
        type: 'concept',
        title: 'Limit Order',
        body:
          'A limit order sets the maximum price you are willing to pay when buying or the minimum price you are willing to accept when selling. It gives price control but may not execute if the market never reaches your limit.',
      },
      {
        type: 'example',
        title: 'Limit Order Example',
        body:
          'If TECH trades at 100 and you place a limit buy at 95, the order should only execute if the simulated price falls to 95 or below. This teaches patience and planning.',
      },
      {
        type: 'concept',
        title: 'Stop-Loss Order',
        body:
          'A stop-loss is designed to help practice loss control. It becomes relevant when price falls to a trigger level. In the simulator, this teaches the idea of deciding your exit before emotions appear.',
      },
      {
        type: 'concept',
        title: 'Take-Profit Order',
        body:
          'A take-profit order helps learners practice discipline after gains. Instead of hoping endlessly for a larger move, the learner defines a target level where the simulated position can be closed.',
      },
      {
        type: 'concept',
        title: 'Execution Priority',
        body:
          'Market orders prioritize speed. Limit orders prioritize price. Stop-loss and take-profit orders prioritize a planned reaction to price movement. No order type removes risk completely.',
      },
      {
        type: 'scenario',
        title: 'Choosing an Order Type',
        body:
          'You want to buy a stock only if it falls from 100 to 95. Which order type is most suitable for this simulation practice?',
        options: ['Market order', 'Limit buy order', 'Take-profit order'],
        answer: 'Limit buy order',
      },
      {
        type: 'checklist',
        title: 'Order Planning Checklist',
        items: [
          'What stock am I trading?',
          'Am I prioritizing speed or price?',
          'What is my planned entry level?',
          'What is my simulated risk limit?',
          'What will I review after execution?',
        ],
      },
      {
        type: 'warning',
        title: 'Execution Risk',
        body:
          'Order types are educational in this platform. They can model trading logic, but they do not guarantee outcomes in real markets.',
      },
    ],
    relatedQuizId: 'basics-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'portfolio-basics',
    category: 'Portfolio Management',
    title: 'Understanding Your Portfolio',
    difficulty: 'Beginner',
    duration: '13 min',
    icon: 'PB',
    color: '#0EA5E9',
    summary:
      'Read cash, holdings, average price, market value, allocation, realized P/L, and unrealized P/L.',
    learningObjectives: [
      'Identify portfolio cash and holdings',
      'Explain average price and market value',
      'Separate realized from unrealized P/L',
      'Use portfolio allocation to understand exposure',
    ],
    content: [
      {
        type: 'text',
        body:
          'A **portfolio** is the full collection of your simulated cash and stock holdings. It shows not only what you bought, but also how much risk and exposure you currently carry.',
      },
      {
        type: 'concept',
        title: 'Cash',
        body:
          'Cash is the unused simulated money in your account. Keeping some cash can help you respond to new opportunities, while using all cash may increase exposure to market movement.',
      },
      {
        type: 'concept',
        title: 'Holdings',
        body:
          'Holdings are the stocks you currently own. Each holding usually includes ticker, number of shares, average purchase price, current price, market value, and profit or loss.',
      },
      {
        type: 'concept',
        title: 'Average Price',
        body:
          'Average price is the blended cost per share after one or more purchases. If you buy 10 shares at 50 and 10 shares at 60, the average price is 55 before fees or other adjustments.',
      },
      {
        type: 'example',
        title: 'Market Value Example',
        body:
          'If you hold 10 shares at a current simulated price of 50, that position has a market value of 500. If the price rises to 55, the market value becomes 550.',
      },
      {
        type: 'concept',
        title: 'Unrealized Profit or Loss',
        body:
          '**Unrealized P/L** is the gain or loss on a position you still hold. It changes whenever the simulated price changes.',
      },
      {
        type: 'concept',
        title: 'Realized Profit or Loss',
        body:
          '**Realized P/L** is recorded after you sell. For example, if you buy at 50 and sell at 60, the gain becomes realized after the sale is executed.',
      },
      {
        type: 'concept',
        title: 'Allocation',
        body:
          'Allocation shows how your portfolio is distributed across stocks, sectors, or cash. A portfolio can be profitable but still risky if most value is concentrated in one area.',
      },
      {
        type: 'scenario',
        title: 'Portfolio Interpretation',
        body:
          'Your portfolio is up 5%, but 80% of the value is in one technology stock. What is the main issue to review?',
        options: ['Concentration risk', 'Only total return', 'Ticker length'],
        answer: 'Concentration risk',
      },
      {
        type: 'checklist',
        title: 'Portfolio Review Routine',
        items: [
          'Check available cash',
          'Review each holding and its weight',
          'Compare average price with current price',
          'Separate realized and unrealized P/L',
          'Identify your largest stock and sector exposure',
        ],
      },
      {
        type: 'tip',
        body:
          'Do not judge a portfolio only by profit. Also review risk, concentration, volatility, and whether each position has a learning purpose.',
      },
    ],
    relatedQuizId: 'portfolio-risk-quiz',
    relatedSimulatorAction: portfolioAction,
  },

  {
    id: 'risk-return',
    category: 'Fundamentals',
    title: 'Risk and Return Tradeoff',
    difficulty: 'Beginner',
    duration: '11 min',
    icon: 'RR',
    color: '#F97316',
    summary:
      'Understand why higher expected return usually comes with higher uncertainty, volatility, and downside risk.',
    learningObjectives: [
      'Define risk and return',
      'Recognize volatility and drawdown',
      'Understand the difference between expected and actual return',
      'Avoid guaranteed-profit thinking',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Return** is the gain or loss from a simulated investment. **Risk** is the uncertainty around that outcome. The key lesson is that higher possible return usually requires accepting higher uncertainty.',
      },
      {
        type: 'concept',
        title: 'Expected Return',
        body:
          'Expected return is what a learner hopes or estimates may happen. Actual return is what really happens in the simulation after prices move.',
      },
      {
        type: 'concept',
        title: 'Volatility',
        body:
          'Volatility describes how widely and quickly a price moves. A high-volatility stock can create larger gains, but it can also create larger losses.',
      },
      {
        type: 'concept',
        title: 'Downside Risk',
        body:
          'Downside risk focuses on what can go wrong. Before entering a simulated trade, ask how much the position could fall and how that would affect your portfolio.',
      },
      {
        type: 'concept',
        title: 'Drawdown',
        body:
          'Drawdown is the decline from a previous portfolio high. For example, if a portfolio rises to 10,000 and then falls to 8,000, the drawdown is 20%.',
      },
      {
        type: 'example',
        title: 'Two Stock Comparison',
        body:
          'Stock A moves slowly and usually changes 1-2% per day. Stock B often changes 8-10% per day. Stock B may feel exciting, but it can damage the portfolio faster if position size is too large.',
      },
      {
        type: 'scenario',
        title: 'Risk Choice',
        body:
          'You can place 70% of your cash into one volatile stock or split the same amount across several sectors. Which choice usually has lower concentration risk?',
        options: ['One volatile stock', 'Several sectors', 'No review needed'],
        answer: 'Several sectors',
      },
      {
        type: 'checklist',
        title: 'Risk-Return Questions',
        items: [
          'What return am I expecting?',
          'What could make the trade fail?',
          'How much could I lose?',
          'How large is this position relative to my portfolio?',
          'What lesson am I practicing?',
        ],
      },
      {
        type: 'warning',
        title: 'No Guarantees',
        body:
          'A high-return idea can still lose money. This module teaches simulated decision-making, not real financial advice.',
      },
    ],
    relatedQuizId: 'risk-management-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'news-impact',
    category: 'Market Behavior',
    title: 'How News Moves Stock Prices',
    difficulty: 'Beginner',
    duration: '13 min',
    icon: 'NI',
    color: '#EC4899',
    summary:
      'Learn how positive, negative, sector-wide, macro, and sentiment news can affect simulated prices.',
    learningObjectives: [
      'Classify news sentiment',
      'Connect company and sector news to price movement',
      'Understand the difference between short-term reaction and long-term impact',
      'Practice reading simulated news before trading',
    ],
    content: [
      {
        type: 'text',
        body:
          'News changes what learners believe about future value. In the simulator, news can affect demand, selling pressure, sector sentiment, and volatility.',
      },
      {
        type: 'concept',
        title: 'Positive Company News',
        body:
          'Strong simulated earnings, successful product launches, new partnerships, or analyst upgrades can increase demand for a stock.',
      },
      {
        type: 'concept',
        title: 'Negative Company News',
        body:
          'Missed expectations, delayed products, leadership concerns, legal issues, or adverse regulation can increase selling pressure.',
      },
      {
        type: 'concept',
        title: 'Sector-Wide News',
        body:
          'Some stories affect many companies in the same sector. For example, new energy subsidies may support several energy stocks, while stricter technology regulation may pressure multiple technology names.',
      },
      {
        type: 'concept',
        title: 'Macro News',
        body:
          'Interest rates, inflation, exchange rates, and economic growth can affect the broad market. Even good companies may fall when the general market mood becomes negative.',
      },
      {
        type: 'concept',
        title: 'Market Sentiment',
        body:
          'Sentiment is the emotional tone of the market. Optimism can push prices upward for a while; fear can trigger sharp selling even before fundamentals are fully clear.',
      },
      {
        type: 'example',
        title: 'Company-Specific Example',
        body:
          'If GREEN receives simulated news about a successful renewable energy contract, demand may rise for GREEN. However, if the whole market is falling, the price reaction may be smaller than expected.',
      },
      {
        type: 'example',
        title: 'Sector Example',
        body:
          'If a new policy benefits banks, several finance-sector tickers may rise together. This teaches learners to look beyond one ticker and review sector exposure.',
      },
      {
        type: 'scenario',
        title: 'News Scenario',
        body:
          'A simulated rate hike headline appears. Which area should you review first?',
        options: ['Only one ticker', 'All sectors and portfolio exposure', 'Only yesterday price'],
        answer: 'All sectors and portfolio exposure',
      },
      {
        type: 'checklist',
        title: 'News Reading Checklist',
        items: [
          'Is the news positive, negative, or neutral?',
          'Is it company-specific or sector-wide?',
          'Is the impact likely short-term or long-term?',
          'Does my portfolio have exposure to the affected sector?',
          'Is the price already reacting strongly?',
        ],
      },
      {
        type: 'tip',
        body:
          'Read the news before placing a simulated order. This builds the habit of connecting decisions to information, not only to chart movement.',
      },
      {
        type: 'warning',
        title: 'Avoid Overreaction',
        body:
          'A headline can create fast movement, but not every headline changes long-term value. Use the simulator to practice pausing before reacting.',
      },
    ],
    relatedQuizId: 'news-impact-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'diversification-risk',
    category: 'Portfolio Management',
    title: 'Diversification and Concentration Risk',
    difficulty: 'Beginner',
    duration: '13 min',
    icon: 'DR',
    color: '#22C55E',
    summary:
      'Learn why spreading simulated capital across several stocks, sectors, and risk levels can reduce concentration risk.',
    learningObjectives: [
      'Understand concentration risk',
      'Explain why sector allocation matters',
      'Distinguish ticker diversification from sector diversification',
      'Build a simple diversified simulated portfolio',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Diversification** means spreading simulated capital across different stocks and sectors so one position does not dominate the whole portfolio.',
      },
      {
        type: 'concept',
        title: 'Concentration Risk',
        body:
          'Concentration risk appears when too much portfolio value depends on one stock, one sector, or one market theme. A single negative event can then hurt the portfolio heavily.',
      },
      {
        type: 'concept',
        title: 'Ticker Diversification',
        body:
          'Holding many tickers is useful, but it is not enough. Five technology stocks may still behave similarly when technology sentiment changes.',
      },
      {
        type: 'concept',
        title: 'Sector Diversification',
        body:
          'Sector diversification spreads exposure across areas such as technology, finance, energy, consumer, healthcare, or industrials. This can reduce dependence on one economic driver.',
      },
      {
        type: 'concept',
        title: 'Position Weight',
        body:
          'Position weight is the percentage of portfolio value in one holding. A portfolio with ten stocks can still be concentrated if one stock is 70% of value.',
      },
      {
        type: 'example',
        title: 'Weak Diversification Example',
        body:
          'A portfolio holds TECH, AIRO, CLOUD, CHIP, and SOFT. There are five tickers, but all belong to technology. A technology shock may affect all five.',
      },
      {
        type: 'example',
        title: 'Stronger Diversification Example',
        body:
          'A portfolio holds one technology stock, one finance stock, one consumer stock, one energy stock, and some cash. It is not risk-free, but it depends on more than one theme.',
      },
      {
        type: 'scenario',
        title: 'Sector Shock',
        body:
          'Your portfolio has 85% in technology stocks. A negative technology regulation headline appears. What is the key risk?',
        options: ['Sector concentration', 'Too much cash', 'Too many sectors'],
        answer: 'Sector concentration',
      },
      {
        type: 'checklist',
        title: 'Diversification Check',
        items: [
          'Hold multiple tickers',
          'Use at least three sectors',
          'Review the largest single position',
          'Review the largest sector weight',
          'Keep some flexibility through cash',
          'Avoid assuming diversification removes all risk',
        ],
      },
      {
        type: 'tip',
        body:
          'Diversification does not guarantee profit. It helps learners practice controlling exposure so one mistake or event does not dominate the entire simulation result.',
      },
    ],
    practiceTask: {
      title: 'Build a diversified portfolio',
      description:
        'Hold at least 5 simulated stocks from at least 3 different sectors, then review your largest sector weight.',
      type: 'portfolio_diversification',
      target: { minHoldings: 5, minSectors: 3 },
      cta: simulatorAction,
    },
    relatedQuizId: 'portfolio-risk-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'risk-management',
    category: 'Risk Management',
    title: 'Risk Management and Stop-Loss',
    difficulty: 'Beginner',
    duration: '15 min',
    icon: 'RM',
    color: '#EF4444',
    summary:
      'Practice risk planning, volatility awareness, drawdown control, stop-loss logic, and position sizing.',
    learningObjectives: [
      'Estimate downside before entering',
      'Understand drawdown and recovery difficulty',
      'Use position sizing as simulated risk control',
      'Build a simple pre-trade risk plan',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Risk management** protects simulated capital by planning losses before they happen. It is less about predicting every price move and more about surviving when predictions are wrong.',
      },
      {
        type: 'concept',
        title: 'Risk Per Trade',
        body:
          'Risk per trade is the amount you are willing to lose if the simulated trade fails. Beginners should think in percentages of portfolio value, not only in share count.',
      },
      {
        type: 'concept',
        title: 'Drawdown',
        body:
          'Drawdown measures how far a portfolio falls from a previous high. A 50% drawdown requires a 100% gain to recover, which shows why loss control matters.',
      },
      {
        type: 'concept',
        title: 'Position Sizing',
        body:
          'Position sizing decides how much capital goes into one trade. A smaller position in a volatile stock can keep the total portfolio impact more controlled.',
      },
      {
        type: 'concept',
        title: 'Stop-Loss Logic',
        body:
          'A stop-loss is a planned exit level. It teaches learners to decide in advance when the original idea is no longer working.',
      },
      {
        type: 'concept',
        title: 'Take-Profit Logic',
        body:
          'A take-profit target helps practice discipline on the upside. It prevents learners from changing the goal repeatedly after a position rises.',
      },
      {
        type: 'example',
        title: 'Position Sizing Example',
        body:
          'If your simulated portfolio is 10,000 and you only want to risk 2%, the maximum planned loss is 200. If the stop distance is 10 per share, the position size would be about 20 shares.',
      },
      {
        type: 'scenario',
        title: 'Pre-Trade Planning',
        body:
          'You want to buy a volatile stock after positive news. What should you define before entering?',
        options: ['Entry, risk limit, and position size', 'Only expected profit', 'Only company logo'],
        answer: 'Entry, risk limit, and position size',
      },
      {
        type: 'checklist',
        title: 'Risk Plan Checklist',
        items: [
          'Why am I entering?',
          'Where is my invalidation point?',
          'How much can I lose?',
          'How large is the position?',
          'What news or scenario could change my view?',
          'What will I review after the trade?',
        ],
      },
      {
        type: 'warning',
        title: 'Manual Practice',
        body:
          'If current order data does not fully validate stop-loss usage, treat this as a planning exercise and record your intended exit level.',
      },
    ],
    relatedQuizId: 'risk-management-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'candlestick-patterns',
    category: 'Technical Analysis',
    title: 'Reading Candlestick Charts',
    difficulty: 'Beginner',
    duration: '13 min',
    icon: 'CP',
    color: '#16A34A',
    summary:
      'Learn candlestick anatomy and common reversal, continuation, and indecision patterns.',
    learningObjectives: [
      'Read open, high, low, and close',
      'Identify common candle patterns',
      'Understand buyer and seller pressure',
      'Practice pattern recognition in the simulator',
    ],
    content: [
      {
        type: 'text',
        body:
          'A **candlestick chart** shows price movement over time. Each candle represents one period and contains open, high, low, and close prices.',
      },
      {
        type: 'concept',
        title: 'Candle Body',
        body:
          'The body shows the distance between open and close. A larger body suggests stronger movement during the period.',
      },
      {
        type: 'concept',
        title: 'Wicks or Shadows',
        body:
          'The upper and lower wicks show the highest and lowest prices reached during the period. Long wicks can show rejection or uncertainty.',
      },
      {
        type: 'concept',
        title: 'Doji',
        body:
          'A doji appears when the open and close are very close. It suggests indecision between buyers and sellers.',
      },
      {
        type: 'concept',
        title: 'Hammer',
        body:
          'A hammer has a small body and long lower wick. After a downtrend, it can suggest buyers are starting to resist further decline.',
      },
      {
        type: 'concept',
        title: 'Engulfing Pattern',
        body:
          'An engulfing pattern appears when one candle body fully covers the previous candle body. It can suggest a shift in momentum.',
      },
      {
        type: 'example',
        title: 'Reading Buyer Pressure',
        body:
          'If a candle falls sharply during the period but closes near the top, buyers may have pushed price back up. This can suggest demand appeared at lower levels.',
      },
      {
        type: 'scenario',
        title: 'Pattern Context',
        body:
          'You see a hammer after a long downtrend. What should you do before buying in the simulator?',
        options: ['Check confirmation and risk', 'Assume guaranteed reversal', 'Ignore market context'],
        answer: 'Check confirmation and risk',
      },
      {
        type: 'checklist',
        title: 'Candlestick Review Checklist',
        items: [
          'What is the recent trend?',
          'Is the candle body large or small?',
          'Are the wicks long?',
          'Does the pattern appear near support or resistance?',
          'Is there confirming volume, news, or indicator context?',
        ],
      },
      {
        type: 'tip',
        body:
          'Practice in the Patterns tab to connect pattern names with chart shapes before using them in simulated trading.',
      },
    ],
    relatedQuizId: 'technical-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'technical-indicators',
    category: 'Technical Analysis',
    title: 'Technical Indicators Explained',
    difficulty: 'Intermediate',
    duration: '16 min',
    icon: 'TI',
    color: '#8B5CF6',
    summary:
      'Study RSI, MACD, moving averages, Bollinger Bands, and how indicators should be interpreted with context.',
    learningObjectives: [
      'Interpret trend and momentum indicators',
      'Understand overbought and oversold signals',
      'Use indicators with news and risk context',
      'Avoid single-signal decisions',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Technical analysis** studies price, volume, and chart patterns. In this simulator, indicators are learning tools that help users observe market behavior, not predict the future with certainty.',
      },
      {
        type: 'concept',
        title: 'Moving Averages',
        body:
          'A moving average smooths price data. The simple moving average gives equal weight to each period, while the exponential moving average gives more weight to recent prices.',
      },
      {
        type: 'example',
        title: 'Moving Average Example',
        body:
          'If a stock price stays above its moving average, learners may describe the short-term trend as upward. If it repeatedly falls below the average, the trend may be weakening.',
      },
      {
        type: 'concept',
        title: 'RSI',
        body:
          'RSI measures momentum on a 0-100 scale. A value above 70 can suggest overbought conditions, while below 30 can suggest oversold conditions. These are signals, not guarantees.',
      },
      {
        type: 'concept',
        title: 'MACD',
        body:
          'MACD compares short-term and long-term exponential moving averages. It helps learners observe momentum changes, especially when the MACD line crosses the signal line.',
      },
      {
        type: 'concept',
        title: 'Bollinger Bands',
        body:
          'Bollinger Bands show a moving average with upper and lower bands based on volatility. Prices near the bands may indicate unusual movement, but context matters.',
      },
      {
        type: 'scenario',
        title: 'Indicator Conflict',
        body:
          'A stock has positive news, but RSI is already very high. What should you do in the simulator?',
        options: ['Review both news and risk before deciding', 'Ignore RSI completely', 'Assume guaranteed profit'],
        answer: 'Review both news and risk before deciding',
      },
      {
        type: 'checklist',
        title: 'Indicator Review Checklist',
        items: [
          'Is the stock trending or sideways?',
          'Is momentum rising or falling?',
          'Is the stock overbought or oversold?',
          'Is there related news?',
          'Does the signal fit your risk plan?',
        ],
      },
      {
        type: 'warning',
        title: 'Avoid Indicator Overconfidence',
        body:
          'No indicator is perfect. A signal can fail, especially during strong news events or volatile market conditions.',
      },
      {
        type: 'tip',
        body:
          'Use the Market Analysis Lab to inspect indicators on simulation tickers and compare signals before placing practice trades.',
      },
    ],
    relatedQuizId: 'technical-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'investment-psychology',
    category: 'Trading Behavior',
    title: 'Investor Psychology',
    difficulty: 'Intermediate',
    duration: '13 min',
    icon: 'IP',
    color: '#F59E0B',
    summary:
      'Recognize FOMO, panic selling, overtrading, confirmation bias, loss aversion, and journal habits.',
    learningObjectives: [
      'Identify emotional trading patterns',
      'Use a trading journal',
      'Reduce overtrading in the simulation',
      'Build a pre-trade decision routine',
    ],
    content: [
      {
        type: 'text',
        body:
          'Investor psychology studies how emotion and bias affect decisions. In a simulator, the money is virtual, but the emotions can still feel real: excitement, fear, impatience, regret, and overconfidence.',
      },
      {
        type: 'concept',
        title: 'FOMO',
        body:
          'Fear of missing out can lead learners to chase a simulated price move after it already happened. FOMO often appears when a stock rises quickly and the user buys without a plan.',
      },
      {
        type: 'concept',
        title: 'Panic Selling',
        body:
          'Panic selling happens when a learner exits quickly because of fear, not because the original analysis clearly failed. A prewritten plan helps reduce emotional exits.',
      },
      {
        type: 'concept',
        title: 'Overtrading',
        body:
          'Overtrading means making too many trades without clear reasons. It may come from boredom, impatience, or the desire to recover losses quickly.',
      },
      {
        type: 'concept',
        title: 'Confirmation Bias',
        body:
          'Confirmation bias means looking only for information that supports your existing view. For example, after buying TECH, a learner may ignore negative news and only read positive headlines.',
      },
      {
        type: 'concept',
        title: 'Loss Aversion',
        body:
          'Loss aversion means losses feel more painful than similar-sized gains feel rewarding. This can make learners hold losing positions too long or sell winners too early.',
      },
      {
        type: 'example',
        title: 'Overtrading Example',
        body:
          'A learner makes 20 trades in one day because every small price movement feels like an opportunity. At the end, the portfolio is more volatile, but the learner cannot explain the reason for each trade.',
      },
      {
        type: 'scenario',
        title: 'FOMO Scenario',
        body:
          'A stock jumps 12% after simulated news. You feel pressure to buy immediately. What is a better first step?',
        options: ['Pause and review risk', 'Buy all available cash', 'Ignore the news'],
        answer: 'Pause and review risk',
      },
      {
        type: 'checklist',
        title: 'Trading Journal Template',
        items: [
          'Why am I entering?',
          'What information supports the idea?',
          'What information could prove me wrong?',
          'What is my risk limit?',
          'What happened after the trade?',
          'What lesson did I learn?',
        ],
      },
      {
        type: 'tip',
        body:
          'A short trading journal can turn every simulated trade into learning feedback, even when the trade loses money.',
      },
    ],
    relatedQuizId: 'investment-psychology-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'trading-psychology',
    category: 'Strategy',
    title: 'Trading Psychology',
    difficulty: 'Advanced',
    duration: '12 min',
    icon: 'TP',
    color: '#F59E0B',
    summary:
      'Master emotional discipline and develop a calmer trading mindset in the simulator.',
    learningObjectives: [
      'Recognize emotional traps',
      'Create a pre-trade plan',
      'Review trades without blame',
      'Use the simulator to practice discipline',
    ],
    content: [
      {
        type: 'text',
        body:
          'The biggest challenge in trading is often behavior. Fear, greed, and overconfidence can affect simulated decisions even when the lesson is clear.',
      },
      {
        type: 'concept',
        title: 'Emotional Cycle',
        body:
          'Many traders move through excitement, confidence, fear, regret, and revenge trading. Recognizing the cycle helps learners slow down before making impulsive decisions.',
      },
      {
        type: 'concept',
        title: 'Revenge Trading',
        body:
          'Revenge trading happens when a learner tries to recover losses quickly by taking another poorly planned trade. It often increases risk instead of solving the problem.',
      },
      {
        type: 'concept',
        title: 'Process Over Outcome',
        body:
          'A good simulated decision can still lose money. A bad decision can sometimes make money. Review whether the process was disciplined, not only whether the result was profitable.',
      },
      {
        type: 'concept',
        title: 'Pre-Trade Routine',
        body:
          'A pre-trade routine is a short checklist before entering a position. It reduces impulsive action and makes learning more consistent.',
      },
      {
        type: 'checklist',
        title: 'Discipline Checklist',
        items: [
          'Write the reason for the trade',
          'Define the risk',
          'Review position size',
          'Check whether emotion is driving the decision',
          'Record what happened afterward',
        ],
      },
      {
        type: 'scenario',
        title: 'After a Loss',
        body:
          'You lose on two trades in a row. What is the most disciplined next step?',
        options: ['Review the trades and pause', 'Immediately double position size', 'Ignore the losses'],
        answer: 'Review the trades and pause',
      },
      {
        type: 'tip',
        body:
          'Use scenarios in the simulator to practice staying calm during fast market moves.',
      },
    ],
    relatedQuizId: 'investment-psychology-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'portfolio-risk',
    category: 'Portfolio Management',
    title: 'Portfolio Risk Review',
    difficulty: 'Advanced',
    duration: '13 min',
    icon: 'PR',
    color: '#7C3AED',
    summary:
      'Think about portfolio-level exposure, drawdown, correlation, sector weights, and stress scenarios.',
    learningObjectives: [
      'Review aggregate portfolio risk',
      'Detect sector and factor concentration',
      'Connect scenarios to portfolio behavior',
      'Practice portfolio stress testing',
    ],
    content: [
      {
        type: 'text',
        body:
          'Portfolio risk is not only the risk of each stock. It is the combined effect of all holdings, their weights, sectors, volatility, and how they may move together.',
      },
      {
        type: 'concept',
        title: 'Portfolio-Level Risk',
        body:
          'A position can look reasonable alone but become risky when combined with similar holdings. For example, five technology stocks may all react to the same negative sector news.',
      },
      {
        type: 'concept',
        title: 'Correlation',
        body:
          'Correlation describes how assets move together. If many holdings rise and fall at the same time, diversification may be weaker than it appears.',
      },
      {
        type: 'concept',
        title: 'Sector Weight',
        body:
          'Sector weight shows how much of the portfolio belongs to each sector. A high sector weight can expose the portfolio to sector-specific shocks.',
      },
      {
        type: 'concept',
        title: 'Stress Scenario',
        body:
          'A stress scenario asks what might happen if a difficult event occurs, such as a market crash, regulation shock, or negative earnings surprise.',
      },
      {
        type: 'example',
        title: 'Stress Test Example',
        body:
          'If 75% of the portfolio is in growth technology stocks, a technology selloff may reduce the entire portfolio quickly even if only one stock has direct bad news.',
      },
      {
        type: 'scenario',
        title: 'Scenario Review',
        body:
          'If a technology shock affects several holdings at once, what should you inspect?',
        options: ['Only cash', 'Sector allocation', 'Logo color'],
        answer: 'Sector allocation',
      },
      {
        type: 'checklist',
        title: 'Portfolio Risk Checklist',
        items: [
          'What is my largest position?',
          'What is my largest sector?',
          'Which holdings may move together?',
          'What happens if the largest sector falls 10%?',
          'Do I have enough cash flexibility?',
        ],
      },
      {
        type: 'warning',
        title: 'Simulation Context',
        body:
          'Stress testing here is for financial education in a simulated market environment. It is not a real investment recommendation.',
      },
    ],
    practiceTask: {
      title: 'Limit sector concentration',
      description:
        'Build a portfolio where no sector exceeds 60% of simulated stock holdings.',
      type: 'sector_allocation',
      target: { maxSectorPercent: 60 },
      cta: portfolioAction,
    },
    relatedQuizId: 'portfolio-risk-quiz',
    relatedSimulatorAction: portfolioAction,
  },

  {
    id: 'scenario-investing',
    category: 'Strategy',
    title: 'Scenario-Based Investing',
    difficulty: 'Advanced',
    duration: '13 min',
    icon: 'SI',
    color: '#14B8A6',
    summary:
      'Use market scenarios to practice cause-and-effect thinking before making simulated decisions.',
    learningObjectives: [
      'Map scenario drivers',
      'Estimate affected sectors',
      'Practice response planning',
      'Compare possible outcomes instead of assuming one future',
    ],
    content: [
      {
        type: 'text',
        body:
          'Scenario-based investing trains learners to ask: if market conditions change, which stocks and sectors may be affected, and how should I prepare?',
      },
      {
        type: 'concept',
        title: 'Scenario Driver',
        body:
          'A scenario driver is the main force behind the market condition. Examples include inflation, interest rates, commodity prices, regulation, technology disruption, and consumer demand.',
      },
      {
        type: 'concept',
        title: 'Affected Sectors',
        body:
          'Different sectors react differently. A rate hike may affect finance, real estate, consumer spending, and growth stocks in different ways.',
      },
      {
        type: 'concept',
        title: 'Base, Bull, and Bear Cases',
        body:
          'A base case is the normal expected path, a bull case is a better-than-expected outcome, and a bear case is a worse-than-expected outcome.',
      },
      {
        type: 'example',
        title: 'Inflation Scenario',
        body:
          'A high-inflation scenario may pressure growth stocks while changing expectations for finance or energy names. The learner should review sector exposure before acting.',
      },
      {
        type: 'scenario',
        title: 'Policy Shock',
        body:
          'A new regulation increases costs for technology companies. Which portfolio question is most relevant?',
        options: ['How much technology exposure do I have?', 'What is my username?', 'How many badges do I have?'],
        answer: 'How much technology exposure do I have?',
      },
      {
        type: 'checklist',
        title: 'Scenario Notes',
        items: [
          'Identify the driver',
          'List affected sectors',
          'Review position sizes',
          'Define a base case',
          'Define a negative case',
          'Plan what you are practicing',
        ],
      },
      {
        type: 'tip',
        body:
          'Scenario thinking is useful because it prepares you for uncertainty. The goal is not to predict perfectly, but to avoid being surprised by obvious risks.',
      },
    ],
    relatedQuizId: 'advisory-thinking-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'fundamental-analysis',
    category: 'Advisory',
    title: 'Fundamental Analysis Basics',
    difficulty: 'Advanced',
    duration: '14 min',
    icon: 'FA',
    color: '#2563EB',
    summary:
      'Frame a company overview, business drivers, financial health, valuation context, and risk factors in educational terms.',
    learningObjectives: [
      'Write a company overview',
      'Separate investment thesis from risk',
      'Understand financial health indicators',
      'Use educational labels carefully',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Fundamental analysis** studies the business behind a stock. In this simulator, it helps learners move from “the chart is moving” to “what business or market reason could explain this movement?”',
      },
      {
        type: 'concept',
        title: 'Business Overview',
        body:
          'Start by explaining what the simulated company does, which sector it belongs to, what customers it serves, and what may drive demand.',
      },
      {
        type: 'concept',
        title: 'Revenue and Profit',
        body:
          'Revenue shows sales. Profit shows what remains after costs. A company can grow revenue but still face pressure if costs rise faster.',
      },
      {
        type: 'concept',
        title: 'Financial Health',
        body:
          'Financial health can include profitability, debt level, cash flow, and stability. In the simulator, simplified indicators can help users understand these ideas.',
      },
      {
        type: 'concept',
        title: 'Investment Thesis',
        body:
          'A thesis is a reasoned educational view, not a promise. It explains what would need to go right for the simulated stock to perform well.',
      },
      {
        type: 'concept',
        title: 'Risk Factors',
        body:
          'Risk factors explain what could go wrong: weak demand, high debt, bad news, strong competitors, regulation, or high valuation.',
      },
      {
        type: 'example',
        title: 'Simple Thesis Example',
        body:
          '“GREEN may benefit from renewable energy demand, but the stock is sensitive to policy changes and project delays.” This statement includes both opportunity and risk.',
      },
      {
        type: 'scenario',
        title: 'Balanced Analysis',
        body:
          'A report only says “this stock will rise” and gives no risk factors. What is missing?',
        options: ['Risk analysis', 'Ticker color', 'Login button'],
        answer: 'Risk analysis',
      },
      {
        type: 'checklist',
        title: 'Mini Fundamental Note',
        items: [
          'What does the company do?',
          'What sector is it in?',
          'What could support growth?',
          'What could go wrong?',
          'What evidence should be monitored?',
          'Is the conclusion written as simulation-only education?',
        ],
      },
      {
        type: 'warning',
        title: 'Advice Boundary',
        body:
          'Use buy, hold, and sell only as educational simulation labels. Do not present them as real financial advice.',
      },
    ],
    relatedQuizId: 'advisory-thinking-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'market-sentiment',
    category: 'Market Behavior',
    title: 'Market Sentiment and Crowd Behavior',
    difficulty: 'Advanced',
    duration: '12 min',
    icon: 'MS',
    color: '#DB2777',
    summary:
      'Understand how optimism, fear, narratives, and crowd reactions can affect short-term simulated price moves.',
    learningObjectives: [
      'Define sentiment',
      'Connect news tone to crowd behavior',
      'Understand narrative-driven price movement',
      'Avoid chasing popular themes without risk review',
    ],
    content: [
      {
        type: 'text',
        body:
          '**Market sentiment** is the mood of the market. It reflects whether participants are optimistic, fearful, uncertain, or excited about a company, sector, or broad scenario.',
      },
      {
        type: 'concept',
        title: 'Optimism and Fear',
        body:
          'Optimism can make learners more willing to buy, pushing simulated prices upward. Fear can create selling pressure, even if the long-term business story has not changed much.',
      },
      {
        type: 'concept',
        title: 'Narrative',
        body:
          'A narrative is a story that explains why a stock or sector is attractive. For example, “AI growth” or “green energy transition” can attract attention quickly.',
      },
      {
        type: 'concept',
        title: 'Crowded Trade',
        body:
          'A crowded trade occurs when many participants follow the same idea. It can rise quickly, but it can also reverse sharply when expectations change.',
      },
      {
        type: 'example',
        title: 'Narrative Risk',
        body:
          'A popular simulated theme can attract attention quickly, but if the next news item disappoints, the price can reverse because expectations were already too high.',
      },
      {
        type: 'scenario',
        title: 'Sentiment Shift',
        body:
          'A stock rises for several days because of excitement, but there is no new fundamental information. What should you review?',
        options: ['Whether sentiment is driving price', 'Only the color of the chart', 'Nothing, because price always continues'],
        answer: 'Whether sentiment is driving price',
      },
      {
        type: 'checklist',
        title: 'Sentiment Review',
        items: [
          'Is the market reacting to real information or emotion?',
          'Is the move company-specific or sector-wide?',
          'Is the price move already large?',
          'What could change the narrative?',
          'Does the trade still fit my risk plan?',
        ],
      },
      {
        type: 'tip',
        body:
          'Pair sentiment review with risk management before making a simulated decision.',
      },
    ],
    relatedQuizId: 'news-impact-quiz',
    relatedSimulatorAction: simulatorAction,
  },

  {
    id: 'consultant-analysis',
    category: 'Advisory',
    title: 'Thinking Like a Financial Consultant',
    difficulty: 'Advanced',
    duration: '15 min',
    icon: 'CA',
    color: '#0F766E',
    summary:
      'Build an educational stock analysis using company overview, thesis, evidence, risks, scenario thinking, and simulation-only labels.',
    learningObjectives: [
      'Structure a consultant-style note',
      'Balance opportunity and risk',
      'Use evidence before forming a conclusion',
      'Use buy/hold/sell as simulation-only labels',
    ],
    content: [
      {
        type: 'text',
        body:
          'A financial consultant does not simply say “buy” or “sell.” A useful consultant-style analysis explains context, evidence, assumptions, risks, and possible scenarios.',
      },
      {
        type: 'concept',
        title: 'Company Overview',
        body:
          'Start with the simulated company name, sector, business role, and current market context. This helps the reader understand what kind of stock is being analyzed.',
      },
      {
        type: 'concept',
        title: 'Investment Thesis',
        body:
          'The thesis explains the main educational argument. It should answer: why might this simulated stock perform well, and what conditions must hold true?',
      },
      {
        type: 'concept',
        title: 'Evidence',
        body:
          'Evidence may include simulated price trend, news, sector performance, financial indicators, and portfolio context. Evidence prevents the analysis from becoming only an opinion.',
      },
      {
        type: 'concept',
        title: 'Risk Factors',
        body:
          'List risks such as volatility, sector concentration, scenario sensitivity, weak news, high valuation, or sudden sentiment reversal.',
      },
      {
        type: 'concept',
        title: 'Educational Rating',
        body:
          'Buy, hold, and sell labels can be used only as simulation learning labels. The note must make clear that this is not real financial advice.',
      },
      {
        type: 'example',
        title: 'Balanced Advisory Note',
        body:
          '“Hold in simulation: the company has positive sector momentum, but the stock already rose sharply and risk is elevated. Review position size before adding exposure.”',
      },
      {
        type: 'scenario',
        title: 'Consultant Decision',
        body:
          'A user asks whether to buy a volatile stock after a 15% rally. What should a responsible simulated consultant include?',
        options: ['Opportunity, risk, and position-size context', 'Only a buy command', 'A guaranteed profit target'],
        answer: 'Opportunity, risk, and position-size context',
      },
      {
        type: 'checklist',
        title: 'Consultant-Style Note Structure',
        items: [
          'Company overview',
          'Current market context',
          'Investment thesis',
          'Supporting evidence',
          'Risk factors',
          'Scenario view',
          'Simulation-only educational label',
        ],
      },
      {
        type: 'warning',
        title: 'Educational Labels Only',
        body:
          'Buy, hold, and sell labels in this module are for simulated learning and do not provide real financial advice.',
      },
    ],
    practiceTask: {
      title: 'Pass the advisory thinking quiz',
      description:
        'Complete and pass the advisory thinking quiz to confirm you understand thesis, evidence, and risk-factor structure.',
      type: 'complete_quiz',
      target: { quizId: 'advisory-thinking-quiz' },
      cta: { label: 'Start Quiz', path: '/learn' },
    },
    relatedQuizId: 'advisory-thinking-quiz',
    relatedSimulatorAction: simulatorAction,
  },
];

export const QUIZZES = [
  {
    id: 'basics-quiz',
    title: 'Market Basics',
    category: 'Fundamentals',
    icon: 'MB',
    passingScore: 70,
    relatedLessonIds: ['market-basics', 'order-types'],
    badgeId: 'first_lesson',
    questions: [
      {
        question: 'What does a stock represent?',
        options: [
          'A small ownership claim in a company',
          'A guaranteed profit contract',
          'A fixed bank deposit',
          'A government tax code',
        ],
        correct: 0,
        explanation:
          'A stock represents a small ownership claim in a company. In this platform, stocks are simulated for financial education.',
      },
      {
        question: 'What is a ticker symbol?',
        options: [
          'A short code used to identify a stock',
          'A user password',
          'A fixed government price',
          'A quiz score',
        ],
        correct: 0,
        explanation:
          'A ticker symbol is a short code used to identify a stock in charts, portfolios, orders, and news.',
      },
      {
        question: 'What is price discovery?',
        options: [
          'The process where buyer and seller interest forms prices',
          'A fixed price table',
          'A company slogan',
          'A random chart color rule',
        ],
        correct: 0,
        explanation:
          'Price discovery is the process where supply, demand, and trading interest create market prices.',
      },
      {
        question: 'What happens when simulated buying demand is stronger than selling pressure?',
        options: [
          'The price may rise',
          'The price must stay fixed',
          'The stock disappears',
          'The user account is reset',
        ],
        correct: 0,
        explanation:
          'When demand is stronger than supply, price may rise because buyers compete for available shares.',
      },
      {
        question: 'What does liquidity mean?',
        options: [
          'How easily a stock can be traded without large price changes',
          'How much cash a user has after login',
          'The color of the stock chart',
          'A guaranteed trading profit',
        ],
        correct: 0,
        explanation:
          'Liquidity describes how easily an asset can be bought or sold without strongly affecting its price.',
      },
      {
        question: 'What is the bid price?',
        options: [
          'The price buyers are willing to pay',
          'The price sellers are willing to accept',
          'The company revenue',
          'The daily market index',
        ],
        correct: 0,
        explanation:
          'The bid is the price buyers are willing to pay for a stock.',
      },
      {
        question: 'What is the ask price?',
        options: [
          'The price sellers are willing to accept',
          'The lowest historical price',
          'The user portfolio value',
          'The quiz passing score',
        ],
        correct: 0,
        explanation:
          'The ask is the price sellers are willing to accept for a stock.',
      },
      {
        question: 'What is the spread?',
        options: [
          'The difference between bid and ask',
          'The difference between revenue and profit',
          'The number of stocks in a portfolio',
          'The number of completed lessons',
        ],
        correct: 0,
        explanation:
          'The spread is the difference between the bid price and the ask price.',
      },
      {
        question: 'What does a market index show?',
        options: [
          'The overall movement of a group of stocks',
          'Only one user transaction',
          'A fixed stock price',
          'A password recovery signal',
        ],
        correct: 0,
        explanation:
          'A market index summarizes the movement of a group of stocks, such as the whole simulated market or a sector.',
      },
      {
        question: 'Why should learners use the simulator first?',
        options: [
          'To practice market concepts without real financial risk',
          'To guarantee future investment success',
          'To avoid learning about risk',
          'To receive real financial advice',
        ],
        correct: 0,
        explanation:
          'The simulator is designed for financial education and practice without using real money.',
      },
      {
        question: 'What does a market order prioritize?',
        options: [
          'Immediate execution',
          'A guaranteed exact price',
          'Avoiding all risk',
          'Delayed execution only',
        ],
        correct: 0,
        explanation:
          'A market order prioritizes fast execution at the best available simulated price.',
      },
      {
        question: 'What does a limit order control?',
        options: [
          'The maximum buy price or minimum sell price',
          'The company dividend',
          'The market index name',
          'The user learning level',
        ],
        correct: 0,
        explanation:
          'A limit order controls the price condition for execution, but it may not execute if the market does not reach that level.',
      },
      {
        question: 'If a stock trades near 100 and you only want to buy at 95 or lower, what should you use?',
        options: [
          'A limit buy order',
          'A market buy order',
          'A take-profit order',
          'No order type can do this',
        ],
        correct: 0,
        explanation:
          'A limit buy order lets you set the maximum price you are willing to pay.',
      },
      {
        question: 'What is the purpose of a stop-loss order in the simulator?',
        options: [
          'To practice planned loss control',
          'To guarantee that no loss happens',
          'To increase the quiz score',
          'To remove market volatility',
        ],
        correct: 0,
        explanation:
          'A stop-loss is a simulated learning tool for practicing planned exits when price moves against the position.',
      },
      {
        question: 'What is the purpose of a take-profit order?',
        options: [
          'To practice closing a position at a planned gain target',
          'To guarantee unlimited profit',
          'To prevent all price movement',
          'To replace portfolio review',
        ],
        correct: 0,
        explanation:
          'A take-profit order helps learners practice discipline by defining an exit level after gains.',
      },
    ],
  },

  {
    id: 'portfolio-risk-quiz',
    title: 'Portfolio Risk and Diversification',
    category: 'Portfolio Management',
    icon: 'DR',
    passingScore: 70,
    relatedLessonIds: ['portfolio-basics', 'diversification-risk', 'portfolio-risk'],
    badgeId: 'diversification_builder',
    questions: [
      {
        question: 'What is a portfolio?',
        options: [
          'The full collection of simulated cash and holdings',
          'Only one stock chart',
          'Only completed quizzes',
          'A fixed trading fee',
        ],
        correct: 0,
        explanation:
          'A portfolio includes your simulated cash, stock holdings, and the total value of those positions.',
      },
      {
        question: 'What are holdings?',
        options: [
          'The stocks currently owned in the simulation',
          'Only the user password',
          'Only news articles',
          'The market index name',
        ],
        correct: 0,
        explanation:
          'Holdings are the stocks you currently own in your simulated portfolio.',
      },
      {
        question: 'What does average price mean?',
        options: [
          'The blended cost per share after one or more purchases',
          'The highest price in the market',
          'The lowest price in the market',
          'The price of the market index only',
        ],
        correct: 0,
        explanation:
          'Average price is the blended cost per share after one or more simulated purchases.',
      },
      {
        question: 'If you hold 10 shares and the current price is $50, what is the market value?',
        options: ['$500', '$50', '$10', '$5,000'],
        correct: 0,
        explanation:
          'Market value equals number of shares multiplied by current price: 10 × 50 = 500.',
      },
      {
        question: 'What is unrealized P/L?',
        options: [
          'Gain or loss on a position that is still held',
          'Gain or loss after a completed sale only',
          'A guaranteed return',
          'A quiz attempt',
        ],
        correct: 0,
        explanation:
          'Unrealized P/L changes while you still hold the position.',
      },
      {
        question: 'What is realized P/L?',
        options: [
          'Gain or loss recorded after selling a position',
          'Gain or loss before any trade happens',
          'The number of holdings',
          'The current market index',
        ],
        correct: 0,
        explanation:
          'Realized P/L is recorded after a simulated sale is executed.',
      },
      {
        question: 'What is allocation?',
        options: [
          'How portfolio value is distributed across stocks, sectors, or cash',
          'The exact future price of a stock',
          'The password reset method',
          'The color of a candlestick',
        ],
        correct: 0,
        explanation:
          'Allocation shows how your simulated portfolio is distributed across holdings, sectors, and cash.',
      },
      {
        question: 'What is concentration risk?',
        options: [
          'Holding too much value in one stock, sector, or theme',
          'Holding any cash',
          'Using a dashboard',
          'Reading news before trading',
        ],
        correct: 0,
        explanation:
          'Concentration risk appears when one stock, sector, or theme dominates portfolio exposure.',
      },
      {
        question: 'Which portfolio is more diversified by sector?',
        options: [
          'Stocks from technology, healthcare, and finance',
          'Five technology stocks',
          'One large technology position',
          'Only one volatile stock',
        ],
        correct: 0,
        explanation:
          'A portfolio across multiple sectors is usually less dependent on one sector-specific event.',
      },
      {
        question: 'Why can five technology stocks still be risky?',
        options: [
          'They may all react to the same technology-sector shock',
          'They always remove all risk',
          'They guarantee higher returns',
          'They make cash unnecessary',
        ],
        correct: 0,
        explanation:
          'Holding many tickers is not enough if all of them belong to the same sector or theme.',
      },
      {
        question: 'What is position weight?',
        options: [
          'The percentage of portfolio value in one holding',
          'The physical weight of a company',
          'The number of questions in a quiz',
          'The password length',
        ],
        correct: 0,
        explanation:
          'Position weight shows how much of the portfolio is allocated to one holding.',
      },
      {
        question: 'What does sector allocation help you find?',
        options: [
          'Dominant sector exposures',
          'Guaranteed future returns',
          'The exact next price',
          'The number of login attempts',
        ],
        correct: 0,
        explanation:
          'Sector allocation helps identify whether one sector dominates your simulated portfolio.',
      },
      {
        question: 'What is correlation in portfolio risk?',
        options: [
          'How assets move together',
          'How quizzes are scored',
          'How passwords are stored',
          'How chart colors are selected',
        ],
        correct: 0,
        explanation:
          'Correlation describes how assets move together. Highly correlated holdings may reduce the benefit of diversification.',
      },
      {
        question: 'What is a stress scenario?',
        options: [
          'A difficult market condition used to test portfolio exposure',
          'A guaranteed profit plan',
          'A login problem',
          'A fixed stock price',
        ],
        correct: 0,
        explanation:
          'A stress scenario asks how your portfolio may behave under difficult market conditions.',
      },
      {
        question: 'If 80% of your portfolio is in one sector, what should you review first?',
        options: [
          'Sector concentration risk',
          'Only the total number of shares',
          'Only the stock logos',
          'Nothing, because many shares means diversification',
        ],
        correct: 0,
        explanation:
          'A very high sector weight can expose the portfolio to large losses if that sector is hit by negative news.',
      },
    ],
  },

  {
    id: 'risk-management-quiz',
    title: 'Risk Management',
    category: 'Risk Management',
    icon: 'RM',
    passingScore: 70,
    relatedLessonIds: ['risk-return', 'risk-management'],
    badgeId: 'risk_controller',
    questions: [
      {
        question: 'What is risk in investing?',
        options: [
          'Uncertainty around the outcome',
          'A guaranteed loss',
          'A guaranteed gain',
          'Only the number of shares bought',
        ],
        correct: 0,
        explanation:
          'Risk is the uncertainty around the outcome of an investment or simulated trade.',
      },
      {
        question: 'What is return?',
        options: [
          'The gain or loss from a position',
          'Only the company name',
          'The number of news articles',
          'The color of the chart',
        ],
        correct: 0,
        explanation:
          'Return is the gain or loss produced by a position.',
      },
      {
        question: 'What does volatility describe?',
        options: [
          'How widely and quickly price moves',
          'Only company revenue',
          'A badge color',
          'A fixed cash amount',
        ],
        correct: 0,
        explanation:
          'Volatility describes the range and speed of price movement.',
      },
      {
        question: 'Why can high volatility be both attractive and risky?',
        options: [
          'It can create larger gains and larger losses',
          'It removes all uncertainty',
          'It guarantees faster learning progress',
          'It fixes the price',
        ],
        correct: 0,
        explanation:
          'High volatility can increase both upside and downside movement.',
      },
      {
        question: 'What is downside risk?',
        options: [
          'The possibility and size of potential loss',
          'Only the expected profit',
          'The number of completed lessons',
          'The size of the company logo',
        ],
        correct: 0,
        explanation:
          'Downside risk focuses on what can go wrong and how much could be lost.',
      },
      {
        question: 'What is drawdown?',
        options: [
          'A fall from a previous portfolio high',
          'A stock name',
          'A guaranteed stop',
          'A dividend rule',
        ],
        correct: 0,
        explanation:
          'Drawdown measures decline from a previous portfolio high.',
      },
      {
        question: 'If a portfolio falls from 10,000 to 8,000, what is the drawdown?',
        options: ['20%', '2%', '80%', '10%'],
        correct: 0,
        explanation:
          'The portfolio lost 2,000 from a previous high of 10,000, so the drawdown is 20%.',
      },
      {
        question: 'Why does position sizing matter?',
        options: [
          'It controls how much a price move can affect the portfolio',
          'It guarantees profit',
          'It removes all losses',
          'It changes the ticker name',
        ],
        correct: 0,
        explanation:
          'Position sizing helps manage how much a single trade can impact the overall portfolio.',
      },
      {
        question: 'What is risk per trade?',
        options: [
          'The amount you are willing to lose if the trade fails',
          'The amount of profit guaranteed by a trade',
          'The number of stocks in the market',
          'The quiz passing threshold',
        ],
        correct: 0,
        explanation:
          'Risk per trade is the planned amount of loss you are willing to accept if the idea is wrong.',
      },
      {
        question: 'When should risk planning happen?',
        options: [
          'Before entering a trade',
          'Only after a large loss',
          'Only after a gain',
          'Never in simulation',
        ],
        correct: 0,
        explanation:
          'Planning risk before entry supports disciplined simulated decisions.',
      },
      {
        question: 'A stop-loss in this module is best understood as:',
        options: [
          'A simulated practice tool for planned exits',
          'A real financial advice instruction',
          'A profit guarantee',
          'A quiz badge',
        ],
        correct: 0,
        explanation:
          'Stop-loss orders are used here for simulation practice and education.',
      },
      {
        question: 'What does a take-profit target help learners practice?',
        options: [
          'Discipline after gains',
          'Guaranteed unlimited profit',
          'Avoiding all risk',
          'Skipping portfolio review',
        ],
        correct: 0,
        explanation:
          'A take-profit target helps learners define an exit level instead of changing goals emotionally.',
      },
      {
        question: 'If your simulated portfolio is 10,000 and you risk 2%, what is the maximum planned loss?',
        options: ['200', '2,000', '20', '5,000'],
        correct: 0,
        explanation:
          '2% of 10,000 is 200.',
      },
      {
        question: 'What should be included in a simple risk plan?',
        options: [
          'Entry reason, risk limit, position size, and review plan',
          'Only expected profit',
          'Only ticker color',
          'Only the number of badges',
        ],
        correct: 0,
        explanation:
          'A basic risk plan should include why you enter, where you are wrong, how much you risk, and how you will review the trade.',
      },
      {
        question: 'Why is “guaranteed profit” thinking dangerous?',
        options: [
          'Because all trades involve uncertainty',
          'Because volatility never exists',
          'Because all stocks always rise',
          'Because portfolio risk is fixed',
        ],
        correct: 0,
        explanation:
          'No simulated or real trade has a guaranteed outcome. The module teaches uncertainty and risk control.',
      },
    ],
  },

  {
    id: 'technical-quiz',
    title: 'Technical Analysis',
    category: 'Technical Analysis',
    icon: 'TI',
    passingScore: 70,
    relatedLessonIds: ['technical-indicators', 'candlestick-patterns'],
    badgeId: 'market_analyst',
    questions: [
      {
        question: 'What does technical analysis study?',
        options: [
          'Price, volume, charts, and patterns',
          'Only company passwords',
          'Only government tax policy',
          'Only user profile photos',
        ],
        correct: 0,
        explanation:
          'Technical analysis studies price, volume, chart patterns, and market behavior.',
      },
      {
        question: 'What is the purpose of a moving average?',
        options: [
          'To smooth price data and reveal trend direction',
          'To guarantee future price',
          'To calculate user password strength',
          'To remove all volatility',
        ],
        correct: 0,
        explanation:
          'Moving averages smooth price data and help learners observe trend direction.',
      },
      {
        question: 'What is the difference between SMA and EMA?',
        options: [
          'EMA gives more weight to recent prices',
          'SMA is always a guaranteed buy signal',
          'EMA removes all losses',
          'They are unrelated to prices',
        ],
        correct: 0,
        explanation:
          'A simple moving average gives equal weight to all periods, while an exponential moving average emphasizes recent prices more.',
      },
      {
        question: 'What does RSI measure?',
        options: [
          'Momentum on a 0-100 scale',
          'Company revenue',
          'Portfolio cash',
          'The number of quiz questions',
        ],
        correct: 0,
        explanation:
          'RSI measures price momentum on a 0-100 scale.',
      },
      {
        question: 'What does RSI above 70 often suggest?',
        options: [
          'Potentially overbought conditions',
          'Guaranteed rally',
          'No volatility',
          'A company merger',
        ],
        correct: 0,
        explanation:
          'RSI above 70 can suggest overbought conditions, but it needs context.',
      },
      {
        question: 'What does RSI below 30 often suggest?',
        options: [
          'Potentially oversold conditions',
          'Guaranteed bankruptcy',
          'A fixed price',
          'A completed badge',
        ],
        correct: 0,
        explanation:
          'RSI below 30 can suggest oversold conditions, but it is not a guaranteed buy signal.',
      },
      {
        question: 'What is MACD commonly used for?',
        options: [
          'Observing momentum changes',
          'Bank transfers',
          'User authentication',
          'Tax filing',
        ],
        correct: 0,
        explanation:
          'MACD compares moving averages to show momentum shifts.',
      },
      {
        question: 'What do Bollinger Bands show?',
        options: [
          'A moving average with upper and lower volatility bands',
          'A guaranteed price range',
          'Only user ranking',
          'Only dividend payments',
        ],
        correct: 0,
        explanation:
          'Bollinger Bands show a moving average plus upper and lower bands based on volatility.',
      },
      {
        question: 'What information does a candlestick contain?',
        options: [
          'Open, high, low, and close',
          'Only volume',
          'Only company name',
          'Only market index title',
        ],
        correct: 0,
        explanation:
          'Each candlestick shows open, high, low, and close prices for a period.',
      },
      {
        question: 'What does the body of a candle show?',
        options: [
          'The distance between open and close',
          'The total number of investors',
          'The company profit margin only',
          'The quiz explanation length',
        ],
        correct: 0,
        explanation:
          'The body shows the price movement between open and close.',
      },
      {
        question: 'What do candlestick wicks show?',
        options: [
          'The high and low prices reached during the period',
          'Only the final price',
          'Only user cash',
          'Only the number of stocks in the portfolio',
        ],
        correct: 0,
        explanation:
          'Wicks show the highest and lowest prices reached during the period.',
      },
      {
        question: 'What does a doji candle suggest?',
        options: [
          'Indecision',
          'Guaranteed profit',
          'No trading',
          'A cash dividend',
        ],
        correct: 0,
        explanation:
          'A doji appears when open and close are close together, suggesting indecision.',
      },
      {
        question: 'What can a hammer suggest after a downtrend?',
        options: [
          'Potential buyer resistance to further decline',
          'Guaranteed reversal',
          'Guaranteed collapse',
          'No market activity',
        ],
        correct: 0,
        explanation:
          'A hammer after a downtrend can suggest buyers are resisting further decline, but confirmation and context are still needed.',
      },
      {
        question: 'What does an engulfing pattern suggest?',
        options: [
          'A possible shift in momentum',
          'A guaranteed dividend',
          'A fixed interest rate',
          'A user login error',
        ],
        correct: 0,
        explanation:
          'An engulfing pattern can suggest a shift in buyer or seller momentum.',
      },
      {
        question: 'Why should learners avoid one-signal decisions?',
        options: [
          'Signals can be noisy and need context',
          'Indicators never move',
          'Charts are illegal',
          'News is always positive',
        ],
        correct: 0,
        explanation:
          'Technical signals can be noisy and should be interpreted with context, news, and risk management.',
      },
    ],
  },

  {
    id: 'news-impact-quiz',
    title: 'News and Sentiment',
    category: 'Market Behavior',
    icon: 'NI',
    passingScore: 70,
    relatedLessonIds: ['news-impact', 'market-sentiment'],
    badgeId: 'market_analyst',
    questions: [
      {
        question: 'Why can news move stock prices?',
        options: [
          'It changes what participants believe about future value',
          'It fixes the price forever',
          'It removes all risk',
          'It changes the user password',
        ],
        correct: 0,
        explanation:
          'News can change expectations, demand, selling pressure, and sentiment.',
      },
      {
        question: 'Which is an example of positive company news?',
        options: [
          'Strong earnings or a successful product launch',
          'A product delay',
          'A legal problem',
          'A missed expectation',
        ],
        correct: 0,
        explanation:
          'Strong earnings and successful product launches can increase buyer interest.',
      },
      {
        question: 'Which is an example of negative company news?',
        options: [
          'Missed expectations or leadership concerns',
          'A successful product launch',
          'A strong earnings report',
          'A positive analyst upgrade',
        ],
        correct: 0,
        explanation:
          'Missed expectations, delays, and leadership concerns can increase selling pressure.',
      },
      {
        question: 'What is sector-wide news?',
        options: [
          'News that can affect many companies in the same sector',
          'News that affects only one password',
          'News that has no market impact',
          'News that only changes badge icons',
        ],
        correct: 0,
        explanation:
          'Sector-wide news can affect multiple related stocks in the same sector.',
      },
      {
        question: 'Which headline is most likely sector-wide?',
        options: [
          'New energy policy supports renewable companies',
          'One user completes a quiz',
          'A single user changes username',
          'A chart changes color',
        ],
        correct: 0,
        explanation:
          'Energy policy may affect several energy-related stocks, not just one company.',
      },
      {
        question: 'What is macro news?',
        options: [
          'Broad economic news such as inflation, rates, or growth',
          'Only a single company logo update',
          'Only a quiz result',
          'Only a portfolio note',
        ],
        correct: 0,
        explanation:
          'Macro news covers broad economic conditions such as interest rates, inflation, and economic growth.',
      },
      {
        question: 'A simulated rate hike headline may affect:',
        options: [
          'Several sectors and the broad market',
          'Only the ticker color',
          'Only one quiz explanation',
          'Nothing in the simulator',
        ],
        correct: 0,
        explanation:
          'Interest rate changes can influence many sectors and overall market sentiment.',
      },
      {
        question: 'What is market sentiment?',
        options: [
          'The mood of the market',
          'A fixed valuation',
          'An order ID',
          'A password',
        ],
        correct: 0,
        explanation:
          'Sentiment describes optimism, fear, uncertainty, or excitement around a company, sector, or market.',
      },
      {
        question: 'What is a market narrative?',
        options: [
          'A popular story explaining why a stock or sector is attractive',
          'A guaranteed price target',
          'A legal instruction',
          'A fixed dividend schedule',
        ],
        correct: 0,
        explanation:
          'A narrative is a market story or theme, such as AI growth or green energy transition.',
      },
      {
        question: 'What is a crowded trade?',
        options: [
          'A trade followed by many participants at the same time',
          'A trade with no participants',
          'A stock with no price movement',
          'A quiz with many answers',
        ],
        correct: 0,
        explanation:
          'A crowded trade happens when many participants follow the same idea, which can increase reversal risk.',
      },
      {
        question: 'Why can sentiment-driven moves reverse quickly?',
        options: [
          'Expectations can change suddenly',
          'Prices are guaranteed to rise forever',
          'News never changes',
          'Risk disappears',
        ],
        correct: 0,
        explanation:
          'Sentiment depends on expectations. If expectations change, price can reverse quickly.',
      },
      {
        question: 'A negative headline should prompt learners to:',
        options: [
          'Review context and risk',
          'Assume a guaranteed drop',
          'Ignore all data',
          'Always buy',
        ],
        correct: 0,
        explanation:
          'News should be interpreted with context, portfolio exposure, and risk controls.',
      },
      {
        question: 'Why should learners avoid overreacting to one headline?',
        options: [
          'Not every headline changes long-term value',
          'Every headline guarantees profit',
          'Charts stop working after news',
          'Portfolio risk disappears',
        ],
        correct: 0,
        explanation:
          'A headline can create fast movement, but learners should review whether it affects short-term sentiment or long-term value.',
      },
      {
        question: 'What should you check if sector news appears?',
        options: [
          'Whether your portfolio has exposure to that sector',
          'Only the total number of badges',
          'Only the password reset page',
          'Nothing, because sector news affects only one company',
        ],
        correct: 0,
        explanation:
          'Sector news can affect several holdings if your portfolio is exposed to that sector.',
      },
      {
        question: 'This platform uses news primarily for:',
        options: [
          'Simulated financial education',
          'Real personalized financial advice',
          'Guaranteed forecasts',
          'Password recovery',
        ],
        correct: 0,
        explanation:
          'News features support education in a simulated market environment.',
      },
    ],
  },

  {
    id: 'investment-psychology-quiz',
    title: 'Investor Psychology',
    category: 'Trading Behavior',
    icon: 'IP',
    passingScore: 70,
    relatedLessonIds: ['investment-psychology', 'trading-psychology'],
    badgeId: 'long_term_thinker',
    questions: [
      {
        question: 'What does investor psychology study?',
        options: [
          'How emotion and bias affect decisions',
          'Only company revenue',
          'Only dividend payment dates',
          'Only password security',
        ],
        correct: 0,
        explanation:
          'Investor psychology studies how emotions and biases influence financial decisions.',
      },
      {
        question: 'What is FOMO?',
        options: [
          'Fear of missing out',
          'Fixed order market operation',
          'Final option matching output',
          'Fundamental ownership margin only',
        ],
        correct: 0,
        explanation:
          'FOMO means fear of missing out and can cause learners to chase a move late.',
      },
      {
        question: 'FOMO can cause learners to:',
        options: [
          'Buy after a large move without a plan',
          'Always diversify correctly',
          'Avoid all emotional decisions',
          'Guarantee profit',
        ],
        correct: 0,
        explanation:
          'FOMO can push learners into late or poorly planned trades.',
      },
      {
        question: 'What is panic selling?',
        options: [
          'Selling because of fear rather than a clear plan',
          'Selling after a completed risk review only',
          'Buying with a limit order',
          'Reading a lesson calmly',
        ],
        correct: 0,
        explanation:
          'Panic selling happens when fear drives the exit instead of a planned decision rule.',
      },
      {
        question: 'What is overtrading?',
        options: [
          'Making too many trades without clear reasons',
          'Holding a diversified portfolio',
          'Completing too many lessons',
          'Keeping a trading journal',
        ],
        correct: 0,
        explanation:
          'Overtrading often comes from urgency, boredom, or the desire to recover losses quickly.',
      },
      {
        question: 'What is confirmation bias?',
        options: [
          'Seeking only information that supports an existing view',
          'Accepting all evidence evenly',
          'Never reading news',
          'Measuring market value',
        ],
        correct: 0,
        explanation:
          'Confirmation bias narrows attention to evidence that confirms what the learner already believes.',
      },
      {
        question: 'What is loss aversion?',
        options: [
          'The tendency to feel losses more strongly than similar gains',
          'The guarantee that losses cannot happen',
          'The process of calculating market index',
          'The rule that all losses must be ignored',
        ],
        correct: 0,
        explanation:
          'Loss aversion means losses often feel more painful than similar-sized gains feel rewarding.',
      },
      {
        question: 'What is revenge trading?',
        options: [
          'Taking poorly planned trades to recover losses quickly',
          'Writing a careful trading journal',
          'Reducing position size after a loss',
          'Completing a quiz after a trade',
        ],
        correct: 0,
        explanation:
          'Revenge trading happens when a learner tries to win back losses quickly, often by increasing risk.',
      },
      {
        question: 'Why is “process over outcome” important?',
        options: [
          'A good decision can lose and a bad decision can win',
          'Profit is always guaranteed by good process',
          'Outcome is never relevant',
          'Charts do not matter',
        ],
        correct: 0,
        explanation:
          'In uncertain markets, a disciplined process matters because single trade outcomes can be noisy.',
      },
      {
        question: 'What should a trading journal record?',
        options: [
          'Reason, risk, result, and lesson learned',
          'Only ticker colors',
          'Only passwords',
          'Only broker fees',
        ],
        correct: 0,
        explanation:
          'A journal helps turn simulated trades into learning feedback.',
      },
      {
        question: 'What is the purpose of a pre-trade routine?',
        options: [
          'To reduce impulsive decisions',
          'To guarantee profit',
          'To remove all losses',
          'To skip risk planning',
        ],
        correct: 0,
        explanation:
          'A pre-trade routine helps learners slow down and check the decision before entering.',
      },
      {
        question: 'You lose on two trades in a row. What is the most disciplined next step?',
        options: [
          'Pause and review the trades',
          'Immediately double position size',
          'Ignore the losses',
          'Trade faster to recover',
        ],
        correct: 0,
        explanation:
          'Pausing and reviewing helps avoid revenge trading and emotional decisions.',
      },
      {
        question: 'What is a common sign of overtrading?',
        options: [
          'Many trades with unclear reasons',
          'A written risk plan',
          'A diversified portfolio',
          'Reading news before trading',
        ],
        correct: 0,
        explanation:
          'Overtrading often shows up as frequent trades without clear reasoning.',
      },
      {
        question: 'A prewritten plan can help with:',
        options: [
          'Discipline',
          'Guaranteed profit',
          'Eliminating all loss',
          'Changing price history',
        ],
        correct: 0,
        explanation:
          'A plan helps separate decisions from emotion.',
      },
      {
        question: 'Why should learners review losing trades without blame?',
        options: [
          'To learn whether the process was sound',
          'To pretend the loss did not happen',
          'To guarantee future wins',
          'To remove all risk from the simulator',
        ],
        correct: 0,
        explanation:
          'A calm review helps learners identify whether the trade followed a good process or was emotionally driven.',
      },
    ],
  },

  {
    id: 'advisory-thinking-quiz',
    title: 'Advisory Thinking',
    category: 'Advisory',
    icon: 'CA',
    passingScore: 70,
    relatedLessonIds: ['scenario-investing', 'fundamental-analysis', 'consultant-analysis'],
    badgeId: 'market_analyst',
    questions: [
      {
        question: 'What is scenario-based investing?',
        options: [
          'Thinking about how different market conditions may affect holdings',
          'Assuming only one future will happen',
          'Ignoring sector exposure',
          'Guaranteeing a future price',
        ],
        correct: 0,
        explanation:
          'Scenario-based investing asks how stocks and sectors may react if market conditions change.',
      },
      {
        question: 'What is a scenario driver?',
        options: [
          'The main force behind a market condition',
          'A user password',
          'A fixed price table',
          'A quiz badge',
        ],
        correct: 0,
        explanation:
          'A scenario driver is the main force behind a market condition, such as inflation, interest rates, regulation, or consumer demand.',
      },
      {
        question: 'What are base, bull, and bear cases?',
        options: [
          'Normal, better-than-expected, and worse-than-expected outcomes',
          'Three types of passwords',
          'Three fixed chart colors',
          'Three guaranteed prices',
        ],
        correct: 0,
        explanation:
          'A base case is the expected path, a bull case is a better outcome, and a bear case is a worse outcome.',
      },
      {
        question: 'What should you review if a new regulation affects technology companies?',
        options: [
          'Your technology-sector exposure',
          'Only your quiz score',
          'Only your username',
          'Only the number of badges',
        ],
        correct: 0,
        explanation:
          'A regulation shock may affect several technology holdings, so sector exposure should be reviewed.',
      },
      {
        question: 'What does fundamental analysis study?',
        options: [
          'The business behind a stock',
          'Only the candlestick color',
          'Only the user account settings',
          'Only quiz completion speed',
        ],
        correct: 0,
        explanation:
          'Fundamental analysis studies the business, financial health, drivers, and risks behind a stock.',
      },
      {
        question: 'What is a business overview?',
        options: [
          'A summary of what the company does and what sector it belongs to',
          'A guaranteed price target',
          'A chart pattern only',
          'A password reset instruction',
        ],
        correct: 0,
        explanation:
          'A business overview explains the company, sector, business role, and market context.',
      },
      {
        question: 'What is revenue?',
        options: [
          'Sales generated by a company',
          'Profit after all costs only',
          'Portfolio cash',
          'The stock ticker',
        ],
        correct: 0,
        explanation:
          'Revenue means sales generated by a company before subtracting expenses.',
      },
      {
        question: 'What is profit?',
        options: [
          'What remains after costs are subtracted from revenue',
          'Total sales before costs',
          'The number of stocks in a portfolio',
          'The market index name',
        ],
        correct: 0,
        explanation:
          'Profit is what remains after costs and expenses are subtracted from revenue.',
      },
      {
        question: 'What is financial health?',
        options: [
          'A view of profitability, debt, cash flow, and stability',
          'Only the color of the stock chart',
          'A fixed quiz result',
          'A guaranteed return',
        ],
        correct: 0,
        explanation:
          'Financial health can include profitability, debt level, cash flow, and business stability.',
      },
      {
        question: 'What is an investment thesis?',
        options: [
          'A reasoned explanation of why a simulated stock may perform well',
          'A promise that price will rise',
          'A password for trading',
          'A random opinion without evidence',
        ],
        correct: 0,
        explanation:
          'An investment thesis explains what could support the simulated stock and what conditions must hold true.',
      },
      {
        question: 'Why should a thesis include risk factors?',
        options: [
          'To show what could go wrong',
          'To guarantee profit',
          'To avoid all uncertainty',
          'To remove the need for evidence',
        ],
        correct: 0,
        explanation:
          'A balanced analysis explains both opportunity and risk.',
      },
      {
        question: 'What counts as evidence in a consultant-style note?',
        options: [
          'Price trend, news, sector performance, or financial indicators',
          'Only personal preference',
          'Only ticker length',
          'Only badge count',
        ],
        correct: 0,
        explanation:
          'Evidence supports the analysis and prevents it from being only an opinion.',
      },
      {
        question: 'A consultant-style note should include:',
        options: [
          'Overview, thesis, evidence, risks, scenarios, and educational label',
          'Only a ticker',
          'Only a guaranteed target',
          'Only a password',
        ],
        correct: 0,
        explanation:
          'Balanced analysis includes context, thesis, supporting evidence, risks, and a careful conclusion.',
      },
      {
        question: 'Buy/hold/sell labels in this platform are:',
        options: [
          'Educational simulation labels only',
          'Real financial advice',
          'Guaranteed outcomes',
          'Required real-world actions',
        ],
        correct: 0,
        explanation:
          'These labels are only for simulated education and should not be treated as real financial advice.',
      },
      {
        question: 'A target price in this module should be treated as:',
        options: [
          'A simulation learning estimate',
          'A guaranteed real price',
          'A legal instruction',
          'A portfolio password',
        ],
        correct: 0,
        explanation:
          'Targets here are educational estimates inside the simulator, not real financial predictions.',
      },
    ],
  },
];

export const LEARNING_PATHS = [
  {
    id: 'beginner-fundamentals',
    title: 'Beginner Path - Stock Market Fundamentals',
    level: 'Beginner',
    icon: 'B',
    description:
      'Build the foundation for using the simulator and reading your first portfolio signals.',
    lessonIds: ['market-basics', 'order-types', 'portfolio-basics', 'risk-return', 'news-impact'],
    quizIds: ['basics-quiz', 'portfolio-risk-quiz', 'news-impact-quiz'],
    estimatedDuration: '63 min',
    outcome:
      'You can explain core market mechanics and safely practice basic simulated trades.',
  },
  {
    id: 'intermediate-portfolio',
    title: 'Intermediate Path - Trading and Portfolio Management',
    level: 'Intermediate',
    icon: 'I',
    description:
      'Move from basic trades to portfolio construction, risk control, chart signals, and psychology.',
    lessonIds: [
      'diversification-risk',
      'risk-management',
      'technical-indicators',
      'candlestick-patterns',
      'investment-psychology',
    ],
    quizIds: [
      'portfolio-risk-quiz',
      'risk-management-quiz',
      'technical-quiz',
      'investment-psychology-quiz',
    ],
    estimatedDuration: '70 min',
    outcome:
      'You can review risk, indicators, and behavior before making simulated decisions.',
  },
  {
    id: 'advanced-advisory',
    title: 'Advanced Path - Strategy and Advisory Thinking',
    level: 'Advanced',
    icon: 'A',
    description:
      'Practice scenario-based reasoning and consultant-style stock analysis in an educational setting.',
    lessonIds: [
      'portfolio-risk',
      'scenario-investing',
      'fundamental-analysis',
      'market-sentiment',
      'consultant-analysis',
    ],
    quizIds: ['portfolio-risk-quiz', 'news-impact-quiz', 'advisory-thinking-quiz'],
    estimatedDuration: '67 min',
    outcome:
      'You can write balanced simulation-only analysis with thesis, evidence, and risk factors.',
  },
];

export const LEARNING_BADGES = [
  {
    id: 'first_lesson',
    name: 'First Lesson',
    icon: '1',
    image: '/badges/first-lesson.svg',
    description: 'Started your learning journey.',
    condition: 'Complete at least 1 lesson.',
  },
  {
    id: 'beginner_graduate',
    name: 'Beginner Graduate',
    icon: 'B',
    image: '/badges/beginner-graduate.svg',
    description: 'Completed the beginner foundation path.',
    condition: 'Complete all Beginner path lessons and quizzes.',
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    icon: 'Q',
    image: '/badges/quiz-master.svg',
    description: 'Strong quiz performance across topics.',
    condition: 'Pass at least 3 quizzes with scores of 80% or higher.',
  },
  {
    id: 'diversification_builder',
    name: 'Diversification Builder',
    icon: 'D',
    image: '/badges/diversification-builder.svg',
    description: 'Connected portfolio practice to diversification.',
    condition: 'Complete diversification learning and hold stocks from at least 3 sectors.',
  },
  {
    id: 'risk_controller',
    name: 'Risk Controller',
    icon: 'R',
    image: '/badges/risk-controller.svg',
    description: 'Practiced risk management concepts.',
    condition: 'Complete the risk management lesson.',
  },
  {
    id: 'market_analyst',
    name: 'Market Analyst',
    icon: 'M',
    image: '/badges/market-analyst.svg',
    description: 'Applied market analysis and technical review skills.',
    condition: 'Complete market-analysis learning and pass a technical or advisory quiz.',
  },
  {
    id: 'long_term_thinker',
    name: 'Long-term Thinker',
    icon: 'L',
    image: '/badges/long-term-thinker.svg',
    description: 'Recognized behavior traps and planning habits.',
    condition: 'Complete investor psychology learning.',
  },
  {
    id: 'simulator_starter',
    name: 'Simulator Starter',
    icon: 'S',
    image: '/badges/simulator-starter.svg',
    description: 'Connected learning with your first simulated market action.',
    condition: 'Complete at least 1 simulated trade.',
  },
  {
    id: 'steady_learner',
    name: 'Steady Learner',
    icon: 'S',
    image: '/badges/steady-learner.svg',
    description: 'Built consistent lesson progress.',
    condition: 'Complete at least 3 lessons.',
  },
  {
    id: 'path_climber',
    name: 'Path Climber',
    icon: 'P',
    image: '/badges/path-climber.svg',
    description: 'Kept climbing through the learning paths.',
    condition: 'Complete at least 5 lessons.',
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    icon: 'P',
    image: '/badges/perfect-score.svg',
    description: 'Answered every question correctly in a quiz attempt.',
    condition: 'Score 100% on any quiz.',
  },
];

export const CANDLESTICK_PATTERNS = [
  {
    name: 'Hammer',
    type: 'bullish',
    description:
      'Small body at top, long lower wick. Found at bottom of downtrend.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const upperWick = c.high - Math.max(c.open, c.close);
      const prevDown = candles[index - 1].close < candles[index - 1].open;
      return lowerWick > body * 2 && upperWick < body * 0.5 && prevDown;
    },
  },
  {
    name: 'Doji',
    type: 'neutral',
    description: 'Open near Close, showing market indecision.',
    detect: (candles, index) => {
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const range = c.high - c.low;
      return range > 0 && body / range < 0.1;
    },
  },
  {
    name: 'Bullish Engulfing',
    type: 'bullish',
    description: 'Green candle completely engulfs previous red candle.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const prev = candles[index - 1];
      const curr = candles[index];
      return (
        prev.close < prev.open &&
        curr.close > curr.open &&
        curr.open < prev.close &&
        curr.close > prev.open
      );
    },
  },
  {
    name: 'Bearish Engulfing',
    type: 'bearish',
    description: 'Red candle completely engulfs previous green candle.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const prev = candles[index - 1];
      const curr = candles[index];
      return (
        prev.close > prev.open &&
        curr.close < curr.open &&
        curr.open > prev.close &&
        curr.close < prev.open
      );
    },
  },
  {
    name: 'Shooting Star',
    type: 'bearish',
    description:
      'Small body at bottom, long upper wick. Found at top of uptrend.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const prevUp = candles[index - 1].close > candles[index - 1].open;
      return upperWick > body * 2 && lowerWick < body * 0.5 && prevUp;
    },
  },
];
