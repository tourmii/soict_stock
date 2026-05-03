/**
 * Learning Center Data — Lessons, Quizzes, and Pattern Definitions
 */

export const LESSONS = [
  {
    id: 'market-basics',
    category: 'Fundamentals',
    title: 'How Stock Markets Work',
    difficulty: 'Beginner',
    duration: '8 min',
    icon: '📈',
    color: '#1B3BFC',
    summary: 'Understand stock exchanges, price discovery, and the forces of supply & demand.',
    content: [
      {
        type: 'text',
        body: `A **stock market** is a marketplace where buyers and sellers trade shares of publicly listed companies. When you buy a stock, you're purchasing a small ownership stake in that company.`
      },
      {
        type: 'concept',
        title: 'Price Discovery',
        body: `Stock prices are determined by **supply and demand**. When more people want to buy a stock (demand) than sell it (supply), the price goes up. Conversely, when more people want to sell than buy, the price drops.`
      },
      {
        type: 'concept',
        title: 'Key Participants',
        body: `• **Retail Investors** — Individual traders like you\n• **Institutional Investors** — Mutual funds, pension funds, hedge funds\n• **Market Makers** — Provide liquidity by always offering to buy and sell\n• **Regulators** — SEC, SEBI ensure fair trading practices`
      },
      {
        type: 'concept',
        title: 'Order Types',
        body: `• **Market Order** — Buy/sell immediately at current market price\n• **Limit Order** — Buy/sell only at a specific price or better\n• **Stop-Loss** — Automatically sell when price falls to a set level to limit losses`
      },
      {
        type: 'tip',
        body: `💡 In our simulator, you can practice all three order types risk-free! Try placing a limit order below the current price and watch it execute when the price drops.`
      }
    ]
  },
  {
    id: 'candlestick-patterns',
    category: 'Technical Analysis',
    title: 'Reading Candlestick Charts',
    difficulty: 'Beginner',
    duration: '10 min',
    icon: '🕯️',
    color: '#22C55E',
    summary: 'Learn to read Japanese candlestick charts and identify key patterns.',
    content: [
      {
        type: 'text',
        body: `**Candlestick charts** are the most popular way to visualize stock prices. Each candlestick represents one time period (e.g., one day) and shows four price points: Open, High, Low, and Close.`
      },
      {
        type: 'concept',
        title: 'Anatomy of a Candlestick',
        body: `• **Body** — The thick part showing the range between Open and Close\n• **Upper Wick/Shadow** — The thin line above the body (High)\n• **Lower Wick/Shadow** — The thin line below the body (Low)\n• **Green/White** candle = Close > Open (bullish)\n• **Red/Black** candle = Close < Open (bearish)`
      },
      {
        type: 'concept',
        title: 'Key Patterns',
        body: `**Doji** — Open ≈ Close, shows indecision. Shaped like a cross.\n\n**Hammer** — Small body at top, long lower wick. Bullish reversal signal at bottom of downtrend.\n\n**Engulfing** — A candle that completely covers the previous one. Bullish engulfing = green candle engulfs red. Bearish engulfing = red candle engulfs green.\n\n**Morning Star** — Three-candle bullish reversal: large red → small doji → large green.`
      },
      {
        type: 'tip',
        body: `🎮 Practice identifying these patterns in our Pattern Recognition game! It uses real data from the simulation.`
      }
    ]
  },
  {
    id: 'technical-indicators',
    category: 'Technical Analysis',
    title: 'Technical Indicators Explained',
    difficulty: 'Intermediate',
    duration: '12 min',
    icon: '🔍',
    color: '#8B5CF6',
    summary: 'Master RSI, MACD, SMA, EMA, and Bollinger Bands with visual examples.',
    content: [
      {
        type: 'text',
        body: `Technical indicators are mathematical calculations based on price and volume data. They help traders identify trends, momentum, and potential reversal points.`
      },
      {
        type: 'concept',
        title: 'Moving Averages (SMA & EMA)',
        body: `**SMA (Simple Moving Average)** — Average price over N periods. SMA-50 and SMA-200 are widely watched.\n\n**EMA (Exponential Moving Average)** — Gives more weight to recent prices, reacts faster to changes.\n\n**Golden Cross** — When SMA-50 crosses above SMA-200 → Bullish signal\n**Death Cross** — When SMA-50 crosses below SMA-200 → Bearish signal`
      },
      {
        type: 'concept',
        title: 'RSI (Relative Strength Index)',
        body: `RSI measures momentum on a 0-100 scale.\n\n• **RSI > 70** → Overbought (potential sell signal)\n• **RSI < 30** → Oversold (potential buy signal)\n• **RSI ≈ 50** → Neutral\n\nBest used with other indicators for confirmation.`
      },
      {
        type: 'concept',
        title: 'MACD',
        body: `**MACD (Moving Average Convergence Divergence)** measures the relationship between two EMAs.\n\n• **MACD Line** = EMA-12 minus EMA-26\n• **Signal Line** = EMA-9 of the MACD line\n• **Histogram** = MACD Line minus Signal Line\n\nBuy signal: MACD crosses above Signal. Sell signal: MACD crosses below Signal.`
      },
      {
        type: 'concept',
        title: 'Bollinger Bands',
        body: `Bollinger Bands create an envelope around price:\n\n• **Middle Band** = SMA-20\n• **Upper Band** = SMA + 2 standard deviations\n• **Lower Band** = SMA - 2 standard deviations\n\nPrice touching the upper band may indicate overbought. Price touching the lower band may indicate oversold. Band squeeze (narrow bands) often precedes big moves.`
      },
      {
        type: 'tip',
        body: `📊 Use our Market Analysis Lab to see these indicators computed in real-time on simulation stocks!`
      }
    ]
  },
  {
    id: 'risk-management',
    category: 'Strategy',
    title: 'Risk Management Essentials',
    difficulty: 'Intermediate',
    duration: '10 min',
    icon: '🛡️',
    color: '#EF4444',
    summary: 'Learn position sizing, stop-losses, and portfolio diversification.',
    content: [
      {
        type: 'text',
        body: `**Risk management** is the most important skill in trading. Professional traders focus more on managing losses than picking winners. A good risk management system protects your capital and keeps you in the game.`
      },
      {
        type: 'concept',
        title: 'The 1-2% Rule',
        body: `Never risk more than **1-2% of your total portfolio** on a single trade.\n\nExample: With a $150,000 portfolio, your max risk per trade should be $1,500-$3,000. This means even 10 consecutive losses would only cost you 10-20% of your capital.`
      },
      {
        type: 'concept',
        title: 'Position Sizing',
        body: `**Position Size = Risk Amount ÷ (Entry Price - Stop-Loss Price)**\n\nExample: Portfolio = $150,000, Risk = 1% = $1,500\nStock price = $100, Stop-loss at $95 (risk = $5/share)\nPosition size = $1,500 ÷ $5 = 300 shares ($30,000 total)`
      },
      {
        type: 'concept',
        title: 'Diversification',
        body: `Don't put all your eggs in one basket:\n\n• Hold **5-15 stocks** across different sectors\n• No single stock should exceed **10-15%** of your portfolio\n• Consider diversifying across **asset classes** (stocks, bonds, commodities)\n• Correlation matters: holding 5 tech stocks isn't true diversification`
      },
      {
        type: 'concept',
        title: 'Risk/Reward Ratio',
        body: `Always aim for a favorable risk/reward ratio:\n\n• **Minimum 1:2** — Risk $1 to potentially gain $2\n• **Ideal 1:3 or better** — Risk $1 to potentially gain $3+\n\nA trader with 40% win rate and 1:3 R/R is still profitable!\n40 wins × $3 = $120 vs 60 losses × $1 = $60 → Net profit = $60`
      },
      {
        type: 'tip',
        body: `🛡️ In the simulator, try using Stop-Loss orders to practice automatic risk management. Set them at 5-10% below your entry price.`
      }
    ]
  },
  {
    id: 'trading-psychology',
    category: 'Strategy',
    title: 'Trading Psychology',
    difficulty: 'Advanced',
    duration: '8 min',
    icon: '🧠',
    color: '#F59E0B',
    summary: 'Master emotional discipline and develop a winning trading mindset.',
    content: [
      {
        type: 'text',
        body: `The biggest enemy in trading isn't the market — it's your own psychology. Fear, greed, and overconfidence cause more losses than bad strategies.`
      },
      {
        type: 'concept',
        title: 'Common Psychological Traps',
        body: `• **FOMO (Fear Of Missing Out)** — Chasing stocks after they've already surged\n• **Loss Aversion** — Holding losers too long, hoping they'll recover\n• **Confirmation Bias** — Only seeking info that supports your position\n• **Overtrading** — Trading too frequently due to boredom or excitement\n• **Revenge Trading** — Taking risky trades to recover losses quickly`
      },
      {
        type: 'concept',
        title: 'Building Discipline',
        body: `1. **Create a trading plan** before entering any position\n2. **Set rules** for entry, exit, and position sizing\n3. **Journal every trade** — record why you entered and what you learned\n4. **Accept losses** as the cost of doing business\n5. **Take breaks** after significant wins or losses`
      },
      {
        type: 'tip',
        body: `🧠 The simulation is perfect for building psychological resilience. Try running the "2008 Financial Crisis" scenario to practice staying calm during extreme market conditions.`
      }
    ]
  },
];

export const QUIZZES = [
  {
    id: 'basics-quiz',
    title: 'Market Basics',
    category: 'Fundamentals',
    icon: '📈',
    questions: [
      {
        question: 'What determines the price of a stock?',
        options: ['The CEO of the company', 'Supply and demand', 'Government regulations', 'The stock exchange'],
        correct: 1,
        explanation: 'Stock prices are determined by supply and demand. When more buyers want a stock, the price rises; when more sellers want to sell, the price falls.'
      },
      {
        question: 'What is a Market Order?',
        options: ['An order to buy/sell at a specific price', 'An order to buy/sell immediately at current market price', 'An order that cancels after a day', 'An order placed by market makers only'],
        correct: 1,
        explanation: 'A market order executes immediately at the best available price. It guarantees execution but not the exact price.'
      },
      {
        question: 'What is a Stop-Loss order used for?',
        options: ['Maximizing profits', 'Limiting potential losses', 'Buying stocks on margin', 'Short selling'],
        correct: 1,
        explanation: 'A stop-loss order automatically sells your stock when it falls to a certain price, helping you limit losses.'
      },
      {
        question: 'What happens during a Limit Order?',
        options: ['You buy at market price', 'You set the maximum/minimum price for execution', 'The order always fills immediately', 'The order is placed at market close'],
        correct: 1,
        explanation: 'A limit order lets you specify the price at which you want to buy or sell. It only executes at your price or better.'
      },
      {
        question: 'Who provides liquidity in the stock market?',
        options: ['Retail investors only', 'Market makers', 'The Federal Reserve', 'Stock analysts'],
        correct: 1,
        explanation: 'Market makers provide liquidity by always offering to buy and sell, ensuring trades can happen smoothly.'
      },
    ]
  },
  {
    id: 'technical-quiz',
    title: 'Technical Analysis',
    category: 'Technical Analysis',
    icon: '🔍',
    questions: [
      {
        question: 'What does RSI > 70 typically indicate?',
        options: ['Oversold condition', 'Overbought condition', 'Neutral market', 'High volume'],
        correct: 1,
        explanation: 'RSI above 70 suggests the stock may be overbought, meaning it has risen sharply and might be due for a pullback.'
      },
      {
        question: 'What is a Golden Cross?',
        options: ['When RSI crosses 50', 'When SMA-50 crosses above SMA-200', 'When MACD crosses zero', 'When price hits all-time high'],
        correct: 1,
        explanation: 'A Golden Cross occurs when the 50-day SMA crosses above the 200-day SMA, considered a strong bullish signal.'
      },
      {
        question: 'What does a Doji candlestick pattern indicate?',
        options: ['Strong bullish momentum', 'Strong bearish momentum', 'Market indecision', 'High trading volume'],
        correct: 2,
        explanation: 'A Doji forms when the open and close prices are nearly equal, indicating indecision between buyers and sellers.'
      },
      {
        question: 'Bollinger Bands squeeze (narrow bands) typically precedes:',
        options: ['Low volatility forever', 'A big price move', 'Stock delisting', 'Dividend payment'],
        correct: 1,
        explanation: 'A Bollinger Band squeeze (when bands narrow) often indicates a period of low volatility that precedes a significant price breakout.'
      },
      {
        question: 'What generates a MACD buy signal?',
        options: ['MACD line crosses above signal line', 'MACD line crosses below signal line', 'MACD reaches zero', 'Histogram becomes negative'],
        correct: 0,
        explanation: 'A MACD buy signal occurs when the MACD line crosses above the signal line, suggesting increasing bullish momentum.'
      },
    ]
  },
  {
    id: 'risk-quiz',
    title: 'Risk Management',
    category: 'Strategy',
    icon: '🛡️',
    questions: [
      {
        question: 'According to the 1-2% rule, how much should you risk per trade with a $100,000 portfolio?',
        options: ['$500-$1,000', '$1,000-$2,000', '$5,000-$10,000', '$10,000-$20,000'],
        correct: 1,
        explanation: 'The 1-2% rule states you should risk no more than 1-2% per trade. With $100,000, that is $1,000-$2,000.'
      },
      {
        question: 'What is an ideal risk/reward ratio?',
        options: ['1:0.5', '1:1', '1:2 or better', '5:1'],
        correct: 2,
        explanation: 'An ideal risk/reward ratio is at least 1:2, meaning you aim to gain at least $2 for every $1 you risk.'
      },
      {
        question: 'Why is diversification important?',
        options: ['It guarantees profits', 'It reduces overall portfolio risk', 'It increases volatility', 'It eliminates all losses'],
        correct: 1,
        explanation: 'Diversification reduces risk by spreading investments across different assets. It doesn\'t guarantee profits but minimizes the impact of any single investment failing.'
      },
      {
        question: 'What is "revenge trading"?',
        options: ['Trading against a competitor', 'Taking risky trades to recover losses quickly', 'Shorting a stock that went up', 'Trading during market close'],
        correct: 1,
        explanation: 'Revenge trading is a common psychological trap where traders take increasingly risky positions to quickly recover losses, often leading to even bigger losses.'
      },
      {
        question: 'How many stocks should a well-diversified portfolio typically hold?',
        options: ['1-2', '5-15', '50-100', '500+'],
        correct: 1,
        explanation: 'Research shows that 5-15 stocks across different sectors provides good diversification. Beyond that, the marginal benefit of adding more stocks diminishes.'
      },
    ]
  },
];

export const CANDLESTICK_PATTERNS = [
  {
    name: 'Hammer',
    type: 'bullish',
    description: 'Small body at top, long lower wick. Found at bottom of downtrend.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const upperWick = c.high - Math.max(c.open, c.close);
      const prevDown = candles[index - 1].close < candles[index - 1].open;
      return lowerWick > body * 2 && upperWick < body * 0.5 && prevDown;
    }
  },
  {
    name: 'Doji',
    type: 'neutral',
    description: 'Open ≈ Close, showing market indecision.',
    detect: (candles, index) => {
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const range = c.high - c.low;
      return range > 0 && body / range < 0.1;
    }
  },
  {
    name: 'Bullish Engulfing',
    type: 'bullish',
    description: 'Green candle completely engulfs previous red candle.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const prev = candles[index - 1];
      const curr = candles[index];
      return prev.close < prev.open && curr.close > curr.open &&
        curr.open < prev.close && curr.close > prev.open;
    }
  },
  {
    name: 'Bearish Engulfing',
    type: 'bearish',
    description: 'Red candle completely engulfs previous green candle.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const prev = candles[index - 1];
      const curr = candles[index];
      return prev.close > prev.open && curr.close < curr.open &&
        curr.open > prev.close && curr.close < prev.open;
    }
  },
  {
    name: 'Shooting Star',
    type: 'bearish',
    description: 'Small body at bottom, long upper wick. Found at top of uptrend.',
    detect: (candles, index) => {
      if (index < 1) return false;
      const c = candles[index];
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const prevUp = candles[index - 1].close > candles[index - 1].open;
      return upperWick > body * 2 && lowerWick < body * 0.5 && prevUp;
    }
  },
];
