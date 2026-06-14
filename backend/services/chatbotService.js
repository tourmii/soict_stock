const disclaimer = 'This is educational guidance for a simulated market, not real financial advice.';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 1800);
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateChatbotReply({ message = '', context = {} }) {
  if (GEMINI_API_KEY) {
    try {
      return await generateGeminiReply({ message, context });
    } catch (err) {
      console.warn('Gemini chatbot fallback:', err.message);
    }
  }
  return generateRuleBasedReply({ message, context });
}

function generateRuleBasedReply({ message = '', context = {} }) {
  const text = message.toLowerCase();
  let reply = '';
  let intent = 'Fallback';
  let suggestions = ['Analyze my risk', 'Recommend a lesson', 'Explain diversification'];
  let cards = [];

  if (/hi|hello|what can you do|help/.test(text)) {
    intent = 'GeneralGreeting';
    reply = 'Hello! I can explain SoictStock concepts, simulated portfolio risk, lessons, quizzes, orders, and platform navigation.';
  } else if (isStockQuestion(text, context)) {
    intent = 'StockAnalysis';
    const m = context.market || {};
    const stock = m.stock || {};
    const summary = m.ohlcvSummary;
    reply = `${stock.ticker || m.mentionedTicker} is ${stock.fullName || stock.name || 'a simulated stock'} in the ${stock.sector || 'market'} sector. Its simulated price is near ${formatMoney(m.prices?.[stock.ticker] || stock.currentPrice || stock.basePrice)}, with the latest tick change around ${formatPercent(m.change?.changePercent)}.`;
    if (summary) {
      reply += ` Over the recent 1H bars available to the assistant, the simulated return is about ${formatPercent(summary.returnPercent)} with a range near ${formatPercent(summary.rangePercent)}.`;
    }
    reply += ' Use this as educational context for the simulator, not as a real buy/sell signal.';
    cards = [{ type: 'navigation', title: stock.ticker || m.mentionedTicker, description: `${stock.sector || 'Simulated'} stock context`, actionLabel: 'Open Simulator', path: '/simulation' }];
  } else if (/portfolio|holding|cash|p\/l|profit|loss/.test(text)) {
    intent = 'ExplainPortfolio';
    const p = context.portfolio || {};
    reply = p.holdingsArray?.length
      ? `Your simulated portfolio has ${p.holdingsArray.length} active holdings and a value near ${formatMoney(p.portfolioValue)}. Review cash, allocation, and unrealized P/L to understand what is driving changes.`
      : 'You do not appear to have active simulated holdings yet. Your portfolio is mostly cash, so a first learning step is Market Basics or a small practice trade.';
    cards = [{ type: 'navigation', title: 'Portfolio', description: 'Review holdings, cash, and P/L.', actionLabel: 'Open Portfolio', path: '/portfolio' }];
  } else if (/risk|diversif|concentration|volatile/.test(text)) {
    intent = 'RiskAnalysis';
    reply = 'In the simulation, risk can come from concentration, high-volatility tickers, large position size, or frequent trading. A useful learning step is to review diversification and position sizing.';
    cards = [{ type: 'lesson', title: 'Diversification and Concentration Risk', description: 'Learn sector allocation and concentration risk.', lessonId: 'diversification-risk', actionLabel: 'Open Lesson', path: '/learn?lessonId=diversification-risk' }];
  } else if (/order|market order|limit|stop/.test(text)) {
    intent = 'OrderHelp';
    reply = 'The current app supports Market, Limit, and Stop-Loss simulated orders. Market prioritizes execution, Limit prioritizes price, and Stop-Loss helps practice planned exits.';
    cards = [{ type: 'navigation', title: 'Simulation', description: 'Practice order placement.', actionLabel: 'Open Simulator', path: '/simulation' }];
  } else if (/lesson|learn next|quiz/.test(text)) {
    intent = text.includes('quiz') ? 'QuizHelp' : 'RecommendLesson';
    reply = 'A useful next step is to follow your recommended learning path. If you are unsure, start with Market Basics, then Portfolio Basics and Diversification.';
    cards = [{ type: 'lesson', title: 'How Stock Markets Work', description: 'Start with market fundamentals.', lessonId: 'market-basics', actionLabel: 'Open Lesson', path: '/learn?lessonId=market-basics' }];
  } else if (/consult|advisor|book|schedule/.test(text)) {
    intent = text.includes('book') || text.includes('schedule') ? 'BookingSupport' : 'ConsultantRecommendation';
    reply = 'For simulated portfolio risk, the Risk Management Analyst is a good fit. For concepts and onboarding, the Financial Education Consultant is a good fit. Booking here is a simulated learning flow.';
  } else if (/where|how do i|market lab|badges|leaderboard|patterns/.test(text)) {
    intent = 'PlatformHelp';
    reply = 'Use Simulation for orders, Portfolio for holdings and P/L, Learn for lessons/quizzes/badges, Market Lab for indicators, Patterns for candlestick practice, and Leaderboard for ranking.';
  } else {
    reply = 'I can help with simulated portfolio analysis, financial concepts, lessons, quizzes, stock movement, orders, and SoictStock consultant guidance.';
  }

  return { reply: `${reply}\n\n${disclaimer}`, intent, suggestions, cards, metadata: { source: 'backend-rule-based' } };
}

async function generateGeminiReply({ message, context }) {
  const promptContext = buildPromptContext(context);
  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: [
              'You are the SoictStock AI Learning Assistant.',
              'You help users understand a virtual stock market simulation and financial education concepts.',
              'You must never provide real financial advice, never tell users to buy or sell real stocks, and never guarantee profit.',
              'Always frame portfolio, trading, stock, and consultant guidance as simulation-based education.',
              'Use cautious language such as may indicate, could suggest, useful to review, and in the simulation.',
              'Answer naturally in plain text. Give complete answers of 2 to 5 short paragraphs or bullet points.',
              'Do not stop after a partial number, sentence, or list item.',
            ].join('\n'),
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `User question: ${message}\n\nSoictStock app context JSON:\n${JSON.stringify(promptContext, null, 2)}\n\nAnswer in plain text only.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        thinkingConfig: buildThinkingConfig(),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  const outputText = extractGeminiOutputText(data);
  if (!outputText) throw new Error('Gemini returned an empty response');
  return makeSafeResponse({
    reply: outputText,
    intent: inferIntent(message),
    suggestions: buildSuggestions(message),
    cards: buildCards(message, context),
    metadata: {
      source: 'gemini-generate-content',
      model: GEMINI_MODEL,
      finishReason: data.candidates?.[0]?.finishReason || null,
    },
  });
}

function buildThinkingConfig() {
  const configured = process.env.GEMINI_THINKING_LEVEL;
  if (configured) return { thinkingLevel: configured };
  if (GEMINI_MODEL.startsWith('gemini-3')) return { thinkingLevel: 'minimal' };
  if (GEMINI_MODEL.startsWith('gemini-2.5')) return { thinkingBudget: 0 };
  return undefined;
}

function inferIntent(message = '') {
  const text = message.toLowerCase();
  if (/portfolio|holding|cash|p\/l|profit|loss/.test(text)) return 'ExplainPortfolio';
  if (/stock|ticker|price|move|moving|volatility|sector|compare/.test(text)) return 'StockAnalysis';
  if (/risk|diversif|concentration|volatile/.test(text)) return 'RiskAnalysis';
  if (/order|market order|limit|stop/.test(text)) return 'OrderHelp';
  if (/lesson|learn next|quiz/.test(text)) return text.includes('quiz') ? 'QuizHelp' : 'RecommendLesson';
  if (/consult|advisor|book|schedule/.test(text)) return text.includes('book') || text.includes('schedule') ? 'BookingSupport' : 'ConsultantRecommendation';
  if (/where|how do i|market lab|badges|leaderboard|patterns/.test(text)) return 'PlatformHelp';
  if (/hi|hello|what can you do|help/.test(text)) return 'GeneralGreeting';
  return 'GeminiAssistant';
}

function isStockQuestion(text = '', context = {}) {
  if (!context.market?.mentionedTicker) return false;
  if (/portfolio|holding|holdings|cash|p\/l|profit|loss/.test(text)) return false;
  return Boolean(context.market.explicitMentionedTicker) || /stock|ticker|price|move|moving|volatility|sector|compare|about|why|what is|explain/.test(text);
}

function buildSuggestions(message = '') {
  const intent = inferIntent(message);
  if (intent === 'RiskAnalysis') return ['Explain diversification', 'Open risk lesson', 'Analyze my portfolio'];
  if (intent === 'OrderHelp') return ['Explain limit orders', 'Explain stop-loss', 'Open simulator'];
  if (intent === 'QuizHelp') return ['Recommend a quiz', 'Explain my score', 'Open learning paths'];
  if (intent === 'StockAnalysis') return ['Compare sector peers', 'Explain volatility', 'Open simulator'];
  if (intent === 'PlatformHelp') return ['Open Market Lab', 'Open Patterns', 'Open Learn'];
  return ['Analyze my risk', 'Recommend a lesson', 'Explain diversification'];
}

function buildCards(message = '', context = {}) {
  const intent = inferIntent(message);
  if (intent === 'RiskAnalysis') {
    return [{ type: 'lesson', title: 'Diversification and Concentration Risk', description: 'Learn sector allocation and concentration risk.', lessonId: 'diversification-risk', actionLabel: 'Open Lesson', path: '/learn?lessonId=diversification-risk' }];
  }
  if (intent === 'OrderHelp') {
    return [{ type: 'navigation', title: 'Simulation', description: 'Practice order placement.', actionLabel: 'Open Simulator', path: '/simulation' }];
  }
  if (intent === 'RecommendLesson') {
    return [buildRecommendedLessonCard(context)].filter(Boolean);
  }
  if (intent === 'QuizHelp') {
    const quiz = chooseRecommendedQuiz(context);
    const relatedLesson = quiz?.relatedLessonIds?.[0] ? findLesson(context, quiz.relatedLessonIds[0]) : null;
    return [
      quiz ? { type: 'quiz', title: quiz.title, description: `${quiz.category || 'Learning'} quiz`, quizId: quiz.id, actionLabel: 'Open Quiz', path: `/learn?quizId=${quiz.id}` } : null,
      relatedLesson ? lessonToCard(relatedLesson) : buildRecommendedLessonCard(context),
    ].filter(Boolean);
  }
  if (intent === 'ExplainPortfolio') {
    return [{ type: 'navigation', title: 'Portfolio', description: 'Review holdings, cash, and P/L.', actionLabel: 'Open Portfolio', path: '/portfolio' }];
  }
  if (intent === 'StockAnalysis') {
    const stock = context.market?.stock;
    return [{ type: 'navigation', title: stock?.ticker || context.market?.mentionedTicker || 'Simulator', description: stock?.fullName || 'Review simulated stock data.', actionLabel: 'Open Simulator', path: '/simulation' }];
  }
  return [];
}

function buildRecommendedLessonCard(context = {}) {
  const recommended = context.learning?.recommended?.lesson;
  const lesson = recommended || chooseFirstIncompleteLesson(context) || findLesson(context, 'market-basics');
  return lesson ? lessonToCard(lesson) : null;
}

function lessonToCard(lesson) {
  return {
    type: 'lesson',
    title: lesson.title,
    description: lesson.summary || lesson.category || 'Recommended learning step',
    lessonId: lesson.id,
    actionLabel: 'Open Lesson',
    path: `/learn?lessonId=${lesson.id}`,
  };
}

function chooseRecommendedQuiz(context = {}) {
  const quizzes = context.learning?.catalog?.quizzes || [];
  const quizResults = context.learning?.quizResults || {};
  const failedId = Object.entries(quizResults).find(([, result]) => (result.lastScore ?? 100) < 70)?.[0];
  if (failedId) return findQuiz(context, failedId);

  const recommendedLessonId = context.learning?.recommended?.lesson?.id;
  if (recommendedLessonId) {
    const relatedQuiz = quizzes.find((quiz) => quiz.relatedLessonIds?.includes(recommendedLessonId));
    if (relatedQuiz && !quizResults[relatedQuiz.id]?.completed) return relatedQuiz;
  }

  return quizzes.find((quiz) => !quizResults[quiz.id]?.completed) || quizzes[0] || null;
}

function chooseFirstIncompleteLesson(context = {}) {
  const lessons = context.learning?.catalog?.lessons || [];
  const lessonProgress = context.learning?.lessonProgress || {};
  return lessons.find((lesson) => !lessonProgress[lesson.id]?.completed) || lessons[0] || null;
}

function findLesson(context = {}, lessonId) {
  return (context.learning?.catalog?.lessons || []).find((lesson) => lesson.id === lessonId) || null;
}

function findQuiz(context = {}, quizId) {
  return (context.learning?.catalog?.quizzes || []).find((quiz) => quiz.id === quizId) || null;
}

function buildPromptContext(context = {}) {
  return {
    route: context.route,
    market: {
      selectedTicker: context.market?.selectedTicker,
      mentionedTicker: context.market?.mentionedTicker,
      explicitMentionedTicker: context.market?.explicitMentionedTicker,
      stock: context.market?.stock,
      change: context.market?.change,
      sectorPeers: (context.market?.sectorPeers || []).slice(0, 5),
      topMovers: context.market?.topMovers || [],
      highVolatilityStocks: context.market?.highVolatilityStocks || [],
      ohlcvSummary: context.market?.ohlcvSummary,
      stockUniverse: (context.market?.stocks || []).map((stock) => ({
        ticker: stock.ticker,
        name: stock.name,
        fullName: stock.fullName,
        sector: stock.sector,
        basePrice: stock.basePrice,
        currentPrice: stock.currentPrice,
        volatility: stock.volatility,
        changePercent: stock.change?.changePercent,
        dailyChangePercent: stock.dailyChange?.changePercent,
      })),
    },
    portfolio: {
      cash: context.portfolio?.cash,
      portfolioValue: context.portfolio?.portfolioValue,
      holdingsArray: (context.portfolio?.holdingsArray || []).slice(0, 8),
      sectorAllocation: (context.portfolio?.sectorAllocation || []).slice(0, 6),
      unrealizedPL: context.portfolio?.unrealizedPL,
      realizedPL: context.portfolio?.realizedPL,
      transactionCount: context.portfolio?.transactions?.length || 0,
      latestTransaction: context.portfolio?.transactions?.[0] || null,
    },
    learning: {
      currentLevel: context.learning?.currentLevel,
      lessonProgress: context.learning?.lessonProgress,
      recommendedLesson: context.learning?.recommended?.lesson
        ? {
            id: context.learning.recommended.lesson.id,
            title: context.learning.recommended.lesson.title,
            summary: context.learning.recommended.lesson.summary,
          }
        : null,
      quizResults: context.learning?.quizResults,
      availableLessons: (context.learning?.catalog?.lessons || []).slice(0, 20),
      availableQuizzes: context.learning?.catalog?.quizzes || [],
    },
    news: {
      relatedNews: (context.news?.relatedNews || []).slice(0, 3).map((item) => ({
        headline: item.headline,
        sentiment: item.sentiment,
        affectedTickers: item.affectedTickers,
        isMarketWide: item.isMarketWide,
      })),
    },
    orders: {
      openOrderCount: context.orders?.openOrderCount,
      openOrders: (context.orders?.openOrders || []).slice(0, 5),
    },
  };
}

function extractGeminiOutputText(data) {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => !part.thought)
    .map((part) => part.text || '')
    .join('\n')
    .trim();
}

function makeSafeResponse(response) {
  let reply = String(response.reply || '')
    .replace(/you should buy/gi, 'in the simulation, you can study')
    .replace(/you should sell/gi, 'in the simulation, you can review')
    .replace(/buy this stock/gi, 'practice analyzing this simulated stock')
    .replace(/sell this stock/gi, 'practice reviewing this simulated position')
    .replace(/guaranteed profit/gi, 'no guaranteed outcome')
    .replace(/will definitely rise/gi, 'may rise or fall in the simulation')
    .replace(/cannot lose/gi, 'can still lose value');

  if (!reply.includes(disclaimer)) reply = `${reply}\n\n${disclaimer}`;
  return { ...response, reply };
}

function formatMoney(value = 0) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatPercent(value = 0) {
  const number = Number(value || 0);
  const sign = number > 0 ? '+' : '';
  return `${sign}${number.toFixed(2)}%`;
}
