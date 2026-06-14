import { STOCKS } from './constants';
import { CHATBOT_KNOWLEDGE } from './chatbotKnowledge';

const intentRules = [
  ['GeneralGreeting', ['hi', 'hello', 'hey', 'what can you do', 'help me']],
  ['ExplainPortfolio', ['explain my portfolio', 'portfolio value', 'biggest holding', 'why am i losing', 'my portfolio']],
  ['RiskAnalysis', ['risky', 'risk analysis', 'analyze my risk', 'diversified', 'concentration risk', 'biggest risk']],
  ['ExplainStockMovement', ['why did', 'why is', 'stock move', 'fall', 'increase', 'up today', 'down today', 'volatile']],
  ['OrderHelp', ['place an order', 'market order', 'limit order', 'stop-loss', 'stop loss', 'order type']],
  ['TradeFeedback', ['last trade', 'overtrade', 'trading behavior', 'too large', 'review my trade']],
  ['RecommendLesson', ['learn next', 'recommend a lesson', 'lesson should', 'failed a quiz', 'what should i learn']],
  ['QuizHelp', ['quiz', 'failed quiz', 'recommend a quiz', 'what quiz']],
  ['NewsExplanation', ['news mean', 'news affect', 'headline', 'sector move', 'sentiment']],
  ['ConsultantRecommendation', ['which consultant', 'consultant should', 'portfolio risk help', 'technical analysis help']],
  ['BookingSupport', ['book consultation', 'schedule advisor', 'talk to consultant', 'book advisor', 'book session']],
  ['PlatformHelp', ['where is', 'how do i use', 'market lab', 'patterns tab', 'badges', 'leaderboard', 'start a quiz']],
];

export function detectIntent(message = '', context = {}) {
  const text = message.toLowerCase();
  const scores = new Map();

  for (const [intent, keywords] of intentRules) {
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 2 : 0), 0);
    if (score > 0) scores.set(intent, score);
  }

  if (CHATBOT_KNOWLEDGE.some((item) => item.aliases.some((alias) => text.includes(alias)))) {
    scores.set('ExplainConcept', (scores.get('ExplainConcept') || 0) + 3);
  }

  if (STOCKS.some((stock) => text.includes(stock.ticker.toLowerCase()))) {
    scores.set('ExplainStockMovement', (scores.get('ExplainStockMovement') || 0) + 2);
  }

  if (context.route?.pageType === 'portfolio' && text.includes('explain')) {
    scores.set('ExplainPortfolio', (scores.get('ExplainPortfolio') || 0) + 1);
  }
  if (context.route?.pageType === 'learn' && text.includes('progress')) {
    scores.set('RecommendLesson', (scores.get('RecommendLesson') || 0) + 2);
  }

  let best = ['Fallback', 0];
  for (const entry of scores.entries()) {
    if (entry[1] > best[1]) best = entry;
  }
  return { intent: best[1] >= 2 ? best[0] : 'Fallback', confidence: best[1] };
}
