import { detectIntent } from './chatbotIntents';
import { findKnowledgeItem } from './chatbotKnowledge';
import { makeResponseSimulationSafe } from './chatbotSafety';
import { analyzePortfolioRisk, analyzeTradeBehavior } from './chatbotAnalytics';
import { CONSULTANTS } from './consultantData';
import { LESSONS, QUIZZES } from './learningData';

const money = (value = 0) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const pct = (value = 0) => `${Number(value || 0).toFixed(1)}%`;

export function generateChatbotReply(message, context) {
  const { intent } = detectIntent(message, context);
  return makeResponseSimulationSafe(buildResponseForIntent(intent, message, context));
}

export function buildResponseForIntent(intent, message, context) {
  const builders = {
    GeneralGreeting: () => buildGreetingResponse(),
    ExplainConcept: () => buildExplainConceptResponse(message),
    ExplainPortfolio: () => buildPortfolioResponse(context),
    RiskAnalysis: () => buildRiskAnalysisResponse(context),
    ExplainStockMovement: () => buildStockMovementResponse(message, context),
    OrderHelp: () => buildOrderHelpResponse(),
    TradeFeedback: () => buildTradeFeedbackResponse(context),
    RecommendLesson: () => buildLearningRecommendationResponse(context),
    QuizHelp: () => buildQuizHelpResponse(context),
    NewsExplanation: () => buildNewsExplanationResponse(context),
    ConsultantRecommendation: () => buildConsultantResponse(message, context),
    BookingSupport: () => buildBookingResponse(message, context),
    PlatformHelp: () => buildPlatformHelpResponse(context),
    Fallback: () => buildFallbackResponse(),
  };
  return (builders[intent] || builders.Fallback)();
}

function lessonCard(lessonId) {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return { type: 'lesson', title: lesson.title, description: lesson.summary, lessonId, actionLabel: 'Open Lesson', path: `/learn?lessonId=${lessonId}` };
}

function quizCard(quizId) {
  const quiz = QUIZZES.find((item) => item.id === quizId);
  if (!quiz) return null;
  return { type: 'quiz', title: quiz.title, description: `${quiz.questions.length} questions`, quizId, actionLabel: 'Open Quiz', path: `/learn?quizId=${quizId}` };
}

function buildGreetingResponse() {
  return {
    reply: 'Hello! I am the SoictStock AI Learning Assistant. I can explain financial concepts, analyze your simulated portfolio, recommend lessons, explain simulated stock movement, and help you use the platform.',
    intent: 'GeneralGreeting',
    suggestions: ['Explain my portfolio', 'Analyze my risk', 'Recommend a lesson', 'Explain stop-loss', 'Connect to consultant'],
    cards: [],
    metadata: {},
  };
}

export function buildExplainConceptResponse(message) {
  const item = findKnowledgeItem(message);
  if (!item) return buildFallbackResponse();
  return {
    reply: `${item.simple}\n\n${item.detailed || ''}${item.example ? `\n\nExample: ${item.example}` : ''}${item.warning ? `\n\nNote: ${item.warning}` : ''}`,
    intent: 'ExplainConcept',
    suggestions: ['Recommend a related lesson', 'Give me a quiz', 'Analyze my risk'],
    cards: [lessonCard(item.relatedLessonIds?.[0]), quizCard(item.relatedQuizIds?.[0])].filter(Boolean),
    metadata: { concept: item.key },
  };
}

export function buildPortfolioResponse(context) {
  const p = context.portfolio;
  if (!p.holdingsArray.length) {
    return {
      reply: `You do not currently have active simulated holdings. Your portfolio is mostly cash (${money(p.cash)}). A good first step is to review Market Basics or place a small practice trade in the simulator.`,
      intent: 'ExplainPortfolio',
      suggestions: ['Open simulator', 'Recommend a lesson', 'What is portfolio?'],
      cards: [lessonCard('market-basics'), { type: 'navigation', title: 'Simulation', description: 'Place practice orders and observe portfolio changes.', actionLabel: 'Open Simulator', path: '/simulation' }],
      metadata: {},
    };
  }
  const largest = p.holdingsArray[0];
  const sector = p.sectorAllocation[0];
  return {
    reply: `Your simulated portfolio value is ${money(p.portfolioValue)} with ${money(p.cash)} in cash and ${p.holdingsArray.length} active holdings. Your largest holding is ${largest.ticker} at about ${money(largest.marketValue)}. Your largest sector is ${sector?.sector || 'N/A'} at ${pct(sector?.percentage || 0)} of invested value. Unrealized P/L is ${money(p.unrealizedPL)} and realized P/L is ${money(p.realizedPL)}.`,
    intent: 'ExplainPortfolio',
    suggestions: ['Analyze my risk', 'What is unrealized P/L?', 'Recommend a lesson'],
    cards: [{ type: 'portfolioInsight', title: 'Portfolio snapshot', metrics: [{ label: 'Value', value: money(p.portfolioValue) }, { label: 'Cash', value: money(p.cash) }, { label: 'Holdings', value: p.holdingsArray.length }] }, lessonCard('portfolio-basics')].filter(Boolean),
    metadata: {},
  };
}

export function buildRiskAnalysisResponse(context) {
  const risk = analyzePortfolioRisk(context);
  const lessonId = risk.level === 'High' ? 'diversification-risk' : risk.level === 'Moderate' ? 'risk-management' : 'portfolio-risk';
  return {
    reply: `Your simulated portfolio risk looks ${risk.level}. This may be because ${risk.reasons.join(', ')}. Largest holding weight is about ${pct(risk.largestHoldingPct)} and largest sector weight is about ${pct(risk.largestSectorPct)}. A useful learning step is to review allocation and position sizing in the simulator.`,
    intent: 'RiskAnalysis',
    suggestions: ['Explain diversification', 'Explain position sizing', 'Recommend a quiz'],
    cards: [lessonCard(lessonId), { type: 'portfolioInsight', title: 'Risk signals', metrics: [{ label: 'Risk level', value: risk.level }, { label: 'Largest holding', value: pct(risk.largestHoldingPct) }, { label: 'Largest sector', value: pct(risk.largestSectorPct) }] }].filter(Boolean),
    metadata: risk,
  };
}

export function buildStockMovementResponse(message, context) {
  const m = context.market;
  const news = context.news.relatedNews[0];
  return {
    reply: `${m.mentionedTicker} is ${m.change.change >= 0 ? 'up' : 'down'} ${pct(m.change.changePercent)} in the current simulation snapshot. The move may relate to simulated demand, sector exposure (${m.stock?.sector || 'unknown sector'}), volatility, and ${news ? `recent news: "${news.headline}"` : 'available market sentiment'}.`,
    intent: 'ExplainStockMovement',
    suggestions: ['Explain news impact', 'Analyze my risk', 'Open Market Lab'],
    cards: [{ type: 'navigation', title: 'Market Lab', description: 'Review indicators for this ticker.', actionLabel: 'Open Learn', path: '/learn?tab=lab' }, lessonCard('news-impact')].filter(Boolean),
    metadata: { ticker: m.mentionedTicker },
  };
}

export function buildOrderHelpResponse() {
  return {
    reply: 'To place a simulated order, go to Simulation, choose a ticker, select Buy or Sell, choose order type, enter quantity, and submit. The current app supports Market, Limit, and Stop-Loss orders. Take-profit is a useful concept to learn, but it is not currently an implemented order type in this app.',
    intent: 'OrderHelp',
    suggestions: ['Explain market order', 'Explain limit order', 'Explain stop-loss', 'Open simulator'],
    cards: [lessonCard('order-types'), { type: 'navigation', title: 'Simulation', description: 'Practice Market, Limit, and Stop-Loss orders.', actionLabel: 'Open Simulator', path: '/simulation' }].filter(Boolean),
    metadata: {},
  };
}

export function buildTradeFeedbackResponse(context) {
  const behavior = analyzeTradeBehavior(context);
  if (!behavior.transactionCount) {
    return { reply: 'You do not have completed simulated trades yet. Try one small practice trade, then review what changed in cash, holdings, and P/L.', intent: 'TradeFeedback', suggestions: ['Open simulator', 'Explain order types'], cards: [lessonCard('market-basics')], metadata: {} };
  }
  const flags = [];
  if (behavior.possibleOvertrading) flags.push('frequent trading may indicate overtrading practice risk');
  if (behavior.largeTrade) flags.push('latest trade may be large relative to portfolio value');
  return {
    reply: `You have ${behavior.transactionCount} simulated transactions. Your latest trade was ${behavior.latest?.type} ${behavior.latest?.quantity} ${behavior.latest?.ticker}. ${flags.length ? `Things to review: ${flags.join(', ')}.` : 'I do not see an obvious behavior warning from the basic checks.'}`,
    intent: 'TradeFeedback',
    suggestions: ['Explain overtrading', 'Recommend risk lesson', 'Analyze my risk'],
    cards: [lessonCard(behavior.possibleOvertrading ? 'investment-psychology' : 'risk-management')].filter(Boolean),
    metadata: behavior,
  };
}

export function buildLearningRecommendationResponse(context) {
  const rec = context.learning.recommended;
  const lesson = rec?.lesson || LESSONS[0];
  return {
    reply: `I recommend "${lesson.title}". ${rec?.reason || 'It is a useful next step for your current learning path.'}`,
    intent: 'RecommendLesson',
    suggestions: ['Open this lesson', 'Recommend a quiz', 'Analyze my risk'],
    cards: [lessonCard(lesson.id)].filter(Boolean),
    metadata: { lessonId: lesson.id },
  };
}

export function buildQuizHelpResponse(context) {
  const entries = Object.entries(context.learning.quizResults || {});
  const failed = entries.find(([, result]) => (result.lastScore ?? 100) < 70);
  const recommendedLessonId = context.learning.recommended?.lesson?.id;
  const recommendedQuiz = recommendedLessonId
    ? QUIZZES.find((item) => item.relatedLessonIds?.includes(recommendedLessonId) && !context.learning.quizResults?.[item.id]?.completed)
    : null;
  const quiz = failed
    ? QUIZZES.find((item) => item.id === failed[0])
    : recommendedQuiz || QUIZZES.find((item) => !context.learning.quizResults?.[item.id]?.completed) || QUIZZES[0];
  return {
    reply: failed
      ? `Your last ${quiz?.title || 'quiz'} score was ${failed[1].lastScore}%, so reviewing related lessons before retrying can help.`
      : `A useful next quiz is ${quiz?.title || 'the next available quiz'}, based on your current learning progress.`,
    intent: 'QuizHelp',
    suggestions: ['Open quiz', 'Recommend lesson', 'Open learning paths'],
    cards: [quizCard(quiz?.id), lessonCard(quiz?.relatedLessonIds?.[0])].filter(Boolean),
    metadata: {},
  };
}

export function buildNewsExplanationResponse(context) {
  const latest = context.news.relatedNews[0] || context.news.latest;
  return {
    reply: latest ? `This simulated news item is ${latest.sentiment || 'neutral'}: "${latest.headline}". News can affect prices by changing learner demand, sector sentiment, and perceived risk. Related tickers: ${(latest.affectedTickers || []).slice(0, 5).join(', ') || 'market-wide'}.` : 'I do not see recent news data right now. In the simulation, prices can still move because of demand, sector trend, volatility, and generated market events.',
    intent: 'NewsExplanation',
    suggestions: ['Explain sentiment', 'Why did this stock move?', 'Open simulator'],
    cards: [lessonCard('news-impact')].filter(Boolean),
    metadata: {},
  };
}

export function buildConsultantResponse(message, context) {
  const intent = context.portfolio?.holdingsArray?.length ? 'RiskAnalysis' : 'ExplainConcept';
  const consultant = CONSULTANTS.find((item) => item.relatedIntents.includes(intent)) || CONSULTANTS[0];
  return {
    reply: `For this need, the best fit is the SoictStock ${consultant.name}. This profile focuses on ${consultant.expertise.join(', ')}.`,
    intent: 'ConsultantRecommendation',
    suggestions: ['Book consultation', 'Recommend a lesson', 'Explain portfolio risk'],
    cards: [{ type: 'consultant', consultantId: consultant.id, title: consultant.name, description: consultant.description, actionLabel: consultant.bookingLabel }],
    metadata: { consultantId: consultant.id },
  };
}

export function buildBookingResponse(message, context) {
  const consultant = CONSULTANTS.find((item) => message.toLowerCase().includes(item.id.split('-')[0])) || CONSULTANTS[0];
  return {
    reply: `I can prepare a simulated booking request with the ${consultant.name}. Available mock slots: Today 15:00, Tomorrow 09:30, Friday 14:00. No payment is required; this is a platform learning flow.`,
    intent: 'BookingSupport',
    suggestions: ['Portfolio risk session', 'Technical analysis session', 'Recommend lesson first'],
    cards: [{ type: 'consultant', consultantId: consultant.id, title: consultant.name, description: consultant.description, actionLabel: consultant.bookingLabel }],
    metadata: {},
  };
}

export function buildPlatformHelpResponse(context) {
  const path = context.route.path;
  const actions = [
    { type: 'navigation', title: 'Simulation', description: 'Place practice orders and observe price movement.', actionLabel: 'Open Simulator', path: '/simulation' },
    { type: 'navigation', title: 'Portfolio', description: 'Review cash, holdings, P/L, and allocation.', actionLabel: 'Open Portfolio', path: '/portfolio' },
    { type: 'navigation', title: 'Learn', description: 'Open lessons, quizzes, Market Lab, Patterns, and Achievements.', actionLabel: 'Open Learn', path: '/learn' },
  ];
  return {
    reply: `You are currently on ${path}. Use Simulation for practice orders, Portfolio for holdings and P/L, Learn for lessons/quizzes/badges, Market Lab for indicators, and Patterns for candlestick practice.`,
    intent: 'PlatformHelp',
    suggestions: ['Open Learn', 'How do I place an order?', 'Where are badges?'],
    cards: actions,
    metadata: {},
  };
}

export function buildFallbackResponse() {
  return {
    reply: 'I can help with simulated portfolio analysis, financial concepts, lessons, quizzes, stock movement, orders, and SoictStock consultant guidance. Try asking: "Analyze my risk" or "What should I learn next?"',
    intent: 'Fallback',
    suggestions: ['Analyze my risk', 'Recommend a lesson', 'Explain diversification', 'Help me place an order'],
    cards: [],
    metadata: {},
  };
}
