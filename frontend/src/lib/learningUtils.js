import { STOCKS } from './constants';

export function getActiveHoldings(holdings = {}) {
  return Object.entries(holdings)
    .filter(([, holding]) => Number(holding?.shares || 0) > 0)
    .map(([ticker, holding]) => ({ ticker, ...holding }));
}

export function getSectorAllocation(holdings = {}, prices = {}, stocks = STOCKS) {
  const sectors = {};
  let totalValue = 0;

  for (const holding of getActiveHoldings(holdings)) {
    const stock = stocks.find((item) => item.ticker === holding.ticker);
    const value = Number(holding.shares || 0) * Number(prices[holding.ticker] || holding.avgPrice || stock?.basePrice || 0);
    if (!stock || value <= 0) continue;
    sectors[stock.sector] = (sectors[stock.sector] || 0) + value;
    totalValue += value;
  }

  return Object.entries(sectors)
    .map(([sector, value]) => ({
      sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export function detectConcentrationRisk(holdings = {}, prices = {}, stocks = STOCKS, threshold = 60) {
  const allocation = getSectorAllocation(holdings, prices, stocks);
  const topSector = allocation[0];
  return {
    hasRisk: Boolean(topSector && topSector.percentage >= threshold),
    topSector,
    allocation,
  };
}

export function detectHighVolatilityExposure(holdings = {}, stocks = STOCKS, threshold = 0.03) {
  const exposed = getActiveHoldings(holdings)
    .map((holding) => stocks.find((stock) => stock.ticker === holding.ticker))
    .filter((stock) => stock && stock.volatility >= threshold);

  return {
    hasRisk: exposed.length > 0,
    tickers: exposed.map((stock) => stock.ticker),
  };
}

export function getNextLessonInPath(path, lessonProgress = {}) {
  return path?.lessonIds?.find((lessonId) => !lessonProgress[lessonId]?.completed) || null;
}

export function calculatePathProgress(path, lessonProgress = {}, quizResults = {}) {
  const lessonTotal = path.lessonIds.length;
  const quizTotal = path.quizIds.length;
  const total = lessonTotal + quizTotal;
  const completedLessons = path.lessonIds.filter((lessonId) => lessonProgress[lessonId]?.completed).length;
  const completedQuizzes = path.quizIds.filter((quizId) => quizResults[quizId]?.completed).length;

  return {
    completedLessons,
    completedQuizzes,
    total,
    percentage: total > 0 ? Math.round(((completedLessons + completedQuizzes) / total) * 100) : 0,
  };
}

export function calculateLearningLevel(lessonProgress = {}, quizResults = {}, paths = []) {
  const beginnerPath = paths.find((path) => path.level === 'Beginner');
  const intermediatePath = paths.find((path) => path.level === 'Intermediate');
  const beginnerDone = beginnerPath && calculatePathProgress(beginnerPath, lessonProgress, quizResults).percentage >= 100;
  const intermediateDone = intermediatePath && calculatePathProgress(intermediatePath, lessonProgress, quizResults).percentage >= 70;

  if (intermediateDone) return 'Advanced';
  if (beginnerDone) return 'Intermediate';
  return 'Beginner';
}

export function isPracticeTaskComplete(task, portfolioContext = {}) {
  if (!task) return { completed: false, status: 'No practice task' };

  const { holdings = {}, transactions = [], prices = {}, quizResults = {}, stocks = STOCKS } = portfolioContext;
  const activeHoldings = getActiveHoldings(holdings);

  if (task.type === 'portfolio_diversification') {
    const sectors = new Set(activeHoldings.map((holding) => stocks.find((stock) => stock.ticker === holding.ticker)?.sector).filter(Boolean));
    const completed = activeHoldings.length >= (task.target?.minHoldings || 1) && sectors.size >= (task.target?.minSectors || 1);
    return {
      completed,
      status: completed
        ? 'Practice task completed'
        : `Not completed yet: ${activeHoldings.length}/${task.target?.minHoldings || 1} holdings and ${sectors.size}/${task.target?.minSectors || 1} sectors.`,
    };
  }

  if (task.type === 'first_trade') {
    const completed = transactions.length > 0;
    return { completed, status: completed ? 'Practice task completed' : 'Not completed yet: place at least one simulated trade.' };
  }

  if (task.type === 'complete_quiz') {
    const result = quizResults[task.target?.quizId || task.relatedQuizId];
    const attempt = result?.attempts?.find((item) => item.passed);
    return { completed: Boolean(attempt), status: attempt ? 'Practice task completed' : 'Not completed yet: pass the related quiz.' };
  }

  if (task.type === 'sector_allocation') {
    const maxPercent = task.target?.maxSectorPercent || 60;
    const allocation = getSectorAllocation(holdings, prices, stocks);
    const topSector = allocation[0];
    const completed = !topSector || topSector.percentage <= maxPercent;
    return {
      completed,
      status: completed
        ? 'Practice task completed'
        : `Not completed yet: ${topSector.sector} is ${Math.round(topSector.percentage)}% of holdings.`,
    };
  }

  return { completed: false, manual: true, status: 'Manual practice: review this task in the simulator.' };
}
