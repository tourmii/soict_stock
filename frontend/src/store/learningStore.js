import { create } from 'zustand';
import { api } from '../lib/api';
import { LEARNING_BADGES, LEARNING_PATHS, LESSONS, QUIZZES } from '../lib/learningData';
import { useSettingsStore } from './settingsStore';
import {
  calculateLearningLevel,
  calculatePathProgress,
  detectConcentrationRisk,
  detectHighVolatilityExposure,
  getNextLessonInPath,
  getSectorAllocation,
} from '../lib/learningUtils';

const STORAGE_KEY = 'soict_learning_progress';

const emptyState = {
  userId: null,
  lessonProgress: {},
  quizResults: {},
  earnedBadges: [],
  newlyEarnedBadges: [],
  currentLevel: 'Beginner',
  recommendedLessonId: null,
  recommendedChallengeId: null,
  loading: false,
  error: null,
};

function normalizeProgress(data = {}) {
  return {
    lessonProgress: data.lessonProgress || {},
    quizResults: data.quizResults || {},
    earnedBadges: Array.isArray(data.earnedBadges) ? data.earnedBadges : [],
    newlyEarnedBadges: [],
    currentLevel: data.currentLevel || 'Beginner',
    recommendedLessonId: data.recommendedLessonId || null,
    recommendedChallengeId: data.recommendedChallengeId || null,
  };
}

function getLessonEntry(progress, lessonId) {
  return progress[lessonId] || {
    lessonId,
    completedSections: [],
    completed: false,
    completedAt: null,
    lastOpenedAt: null,
  };
}

function getBadge(earnedBadges, id) {
  return earnedBadges.find((badge) => (typeof badge === 'string' ? badge === id : badge.id === id));
}

function withBadge(earnedBadges, id) {
  if (!id || getBadge(earnedBadges, id)) return earnedBadges;
  return [...earnedBadges, { id, earnedAt: new Date().toISOString() }];
}

function badgeIds(badges = []) {
  return badges.map((badge) => (typeof badge === 'string' ? badge : badge.id)).filter(Boolean);
}

function buildPayload(state) {
  return {
    userId: state.userId,
    lessonProgress: state.lessonProgress,
    quizResults: state.quizResults,
    earnedBadges: state.earnedBadges,
    currentLevel: state.currentLevel,
    recommendedLessonId: state.recommendedLessonId,
    recommendedChallengeId: state.recommendedChallengeId,
  };
}

export const useLearningStore = create((set, get) => ({
  ...emptyState,

  initializeLearning: async (userId) => {
    set({ userId: userId || null, loading: true, error: null });
    if (userId) {
      await get().loadFromBackend(userId);
    } else {
      get().loadFromLocalStorage();
    }
    set({ loading: false });
  },

  loadFromBackend: async (userId) => {
    try {
      const data = await api.getLearningProgress(userId);
      const normalized = normalizeProgress(data.progress || data);
      set({ ...normalized, userId, error: null });
    } catch (err) {
      console.warn('Learning backend unavailable, using local storage:', err);
      get().loadFromLocalStorage();
      set({ userId, error: null });
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        set({ ...normalizeProgress(), error: null });
        return;
      }
      set({ ...normalizeProgress(JSON.parse(stored)), error: null });
    } catch {
      set({ ...normalizeProgress(), error: null });
    }
  },

  saveToLocalStorage: () => {
    const state = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload(state)));
  },

  persist: async () => {
    const { userId } = get();
    get().saveToLocalStorage();
    if (userId) {
      await get().syncToBackend(userId);
    }
  },

  markSectionComplete: async (lessonId, sectionIndex) => {
    const now = new Date().toISOString();
    const lesson = LESSONS.find((item) => item.id === lessonId);
    set((state) => {
      const existing = getLessonEntry(state.lessonProgress, lessonId);
      const completedSections = Array.from(new Set([...(existing.completedSections || []), sectionIndex])).sort((a, b) => a - b);
      const completed = lesson ? completedSections.length >= lesson.content.length : existing.completed;
      const lessonProgress = {
        ...state.lessonProgress,
        [lessonId]: {
          ...existing,
          completedSections,
          completed,
          completedAt: completed ? existing.completedAt || now : existing.completedAt,
          lastOpenedAt: now,
        },
      };
      return {
        lessonProgress,
        currentLevel: calculateLearningLevel(lessonProgress, state.quizResults, LEARNING_PATHS),
      };
    });
    if (get().userId) {
      api.markLearningSection({ userId: get().userId, lessonId, sectionIndex }).catch(() => {});
    }
    get().evaluateBadges();
    await get().persist();
  },

  markLessonOpened: async (lessonId) => {
    set((state) => {
      const existing = getLessonEntry(state.lessonProgress, lessonId);
      return {
        lessonProgress: {
          ...state.lessonProgress,
          [lessonId]: { ...existing, lastOpenedAt: new Date().toISOString() },
        },
      };
    });
    await get().persist();
  },

  markLessonComplete: async (lessonId) => {
    const lesson = LESSONS.find((item) => item.id === lessonId);
    const completedSections = lesson ? lesson.content.map((_, index) => index) : [];
    const now = new Date().toISOString();
    set((state) => {
      const existing = getLessonEntry(state.lessonProgress, lessonId);
      const lessonProgress = {
        ...state.lessonProgress,
        [lessonId]: {
          ...existing,
          completedSections,
          completed: true,
          completedAt: existing.completedAt || now,
          lastOpenedAt: now,
        },
      };
      return {
        lessonProgress,
        currentLevel: calculateLearningLevel(lessonProgress, state.quizResults, LEARNING_PATHS),
      };
    });
    get().evaluateBadges();
    await get().persist();
  },

  saveQuizResult: async (quizId, score, totalQuestions) => {
    const quiz = QUIZZES.find((item) => item.id === quizId);
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz?.passingScore || 70);
    const attempt = { score, totalQuestions, percentage, passed, completedAt: new Date().toISOString() };

    set((state) => {
      const existing = state.quizResults[quizId] || { quizId, attempts: [], bestScore: 0, lastScore: 0, completed: false };
      const attempts = [...(existing.attempts || []), attempt];
      const bestScore = Math.max(existing.bestScore || 0, percentage);
      const quizResults = {
        ...state.quizResults,
        [quizId]: {
          ...existing,
          attempts,
          bestScore,
          lastScore: percentage,
          completed: passed || existing.completed || percentage >= (quiz?.passingScore || 70),
        },
      };
      return {
        quizResults,
        currentLevel: calculateLearningLevel(state.lessonProgress, quizResults, LEARNING_PATHS),
      };
    });

    if (get().userId) {
      try {
        await api.saveQuizResult({ userId: get().userId, quizId, score, totalQuestions });
      } catch {
        // The full progress sync below and localStorage fallback still preserve the attempt.
      }
    }
    get().evaluateBadges();
    await get().persist();
  },

  calculateOverallProgress: () => {
    const { lessonProgress, quizResults } = get();
    const total = LESSONS.length + QUIZZES.length;
    const completedLessons = LESSONS.filter((lesson) => lessonProgress[lesson.id]?.completed).length;
    const completedQuizzes = QUIZZES.filter((quiz) => quizResults[quiz.id]?.completed).length;
    return total > 0 ? Math.round(((completedLessons + completedQuizzes) / total) * 100) : 0;
  },

  calculateAverageQuizScore: () => {
    const attempts = Object.values(get().quizResults).flatMap((result) => result.attempts || []);
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / attempts.length);
  },

  getCompletedLessonCount: () => LESSONS.filter((lesson) => get().lessonProgress[lesson.id]?.completed).length,

  getCompletedQuizCount: () => QUIZZES.filter((quiz) => get().quizResults[quiz.id]?.completed).length,

  getLessonProgress: (lessonId) => getLessonEntry(get().lessonProgress, lessonId),

  getRecommendedLesson: (lessons = LESSONS, paths = LEARNING_PATHS, portfolioContext = {}) => {
    const { lessonProgress, quizResults } = get();
    const completedCount = Object.values(lessonProgress).filter((item) => item.completed).length;
    const failedQuiz = Object.entries(quizResults).find(([, result]) => (result.lastScore ?? 100) < 70);
    const concentration = detectConcentrationRisk(portfolioContext.holdings, portfolioContext.prices, portfolioContext.stocks);
    const volatility = detectHighVolatilityExposure(portfolioContext.holdings, portfolioContext.stocks);
    const frequentTrades = (portfolioContext.transactions || []).length >= 10;

    let lessonId = null;
    let reason = '';

    if (completedCount === 0) {
      lessonId = 'market-basics';
      reason = 'Because you are starting your first learning path.';
    } else if (concentration.hasRisk && !lessonProgress['diversification-risk']?.completed) {
      lessonId = 'diversification-risk';
      reason = `Because your portfolio is concentrated in ${concentration.topSector?.sector}.`;
    } else if (volatility.hasRisk && !lessonProgress['risk-management']?.completed) {
      lessonId = 'risk-management';
      reason = `Because you hold high-volatility simulated stocks: ${volatility.tickers.join(', ')}.`;
    } else if (frequentTrades && !lessonProgress['investment-psychology']?.completed) {
      lessonId = 'investment-psychology';
      reason = 'Because your recent simulator activity suggests reviewing trading behavior.';
    } else if (failedQuiz) {
      const quiz = QUIZZES.find((item) => item.id === failedQuiz[0]);
      lessonId = quiz?.relatedLessonIds?.find((id) => !lessonProgress[id]?.completed) || quiz?.relatedLessonIds?.[0];
      reason = 'Because your last quiz score was below 70%.';
    }

    if (!lessonId) {
      const partialPath = paths.find((path) => {
        const progress = calculatePathProgress(path, lessonProgress, quizResults);
        return progress.percentage > 0 && progress.percentage < 100;
      });
      lessonId = partialPath ? getNextLessonInPath(partialPath, lessonProgress) : null;
      reason = partialPath ? `Because you are ${calculatePathProgress(partialPath, lessonProgress, quizResults).percentage}% through ${partialPath.level} Path.` : '';
    }

    if (!lessonId) {
      const beginner = paths.find((path) => path.level === 'Beginner');
      const beginnerDone = beginner && beginner.lessonIds.every((lessonId) => lessonProgress[lessonId]?.completed);
      const nextPath = beginnerDone ? paths.find((path) => path.level === 'Intermediate') : beginner;
      lessonId = getNextLessonInPath(nextPath, lessonProgress) || lessons.find((lesson) => !lessonProgress[lesson.id]?.completed)?.id;
      reason = beginnerDone ? 'Because you finished the Beginner path.' : 'Because it is the next step in your current path.';
    }

    const lesson = lessons.find((item) => item.id === lessonId) || lessons[0];
    return { lesson, lessonId: lesson?.id, reason };
  },

  evaluateBadges: (portfolioContext = {}) => {
    const { lessonProgress, quizResults } = get();
    const previousIds = new Set(badgeIds(get().earnedBadges));
    let earnedBadges = [...get().earnedBadges];
    const completedLessons = Object.values(lessonProgress).filter((item) => item.completed).length;
    const strongQuizzes = Object.values(quizResults).filter((result) => (result.bestScore || 0) >= 80).length;
    const perfectQuiz = Object.values(quizResults).some((result) => (result.bestScore || 0) >= 100);
    const beginnerPath = LEARNING_PATHS.find((path) => path.level === 'Beginner');
    const beginnerDone = beginnerPath && calculatePathProgress(beginnerPath, lessonProgress, quizResults).percentage === 100;
    const sectorCount = getSectorAllocation(portfolioContext.holdings, portfolioContext.prices, portfolioContext.stocks).length;
    const transactionCount = (portfolioContext.transactions || []).length;

    if (completedLessons >= 1) earnedBadges = withBadge(earnedBadges, 'first_lesson');
    if (transactionCount >= 1) earnedBadges = withBadge(earnedBadges, 'simulator_starter');
    if (completedLessons >= 3) earnedBadges = withBadge(earnedBadges, 'steady_learner');
    if (completedLessons >= 5) earnedBadges = withBadge(earnedBadges, 'path_climber');
    if (beginnerDone) earnedBadges = withBadge(earnedBadges, 'beginner_graduate');
    if (strongQuizzes >= 3) earnedBadges = withBadge(earnedBadges, 'quiz_master');
    if (perfectQuiz) earnedBadges = withBadge(earnedBadges, 'perfect_score');
    if (lessonProgress['diversification-risk']?.completed && sectorCount >= 3) earnedBadges = withBadge(earnedBadges, 'diversification_builder');
    if (lessonProgress['risk-management']?.completed) earnedBadges = withBadge(earnedBadges, 'risk_controller');
    if (lessonProgress['technical-indicators']?.completed && quizResults['technical-quiz']?.completed) earnedBadges = withBadge(earnedBadges, 'market_analyst');
    if (lessonProgress['investment-psychology']?.completed) earnedBadges = withBadge(earnedBadges, 'long_term_thinker');

    earnedBadges = earnedBadges.filter((badge) => LEARNING_BADGES.some((item) => item.id === (typeof badge === 'string' ? badge : badge.id)));
    const newlyEarnedBadges = earnedBadges
      .filter((badge) => !previousIds.has(typeof badge === 'string' ? badge : badge.id))
      .map((badge) => {
        const id = typeof badge === 'string' ? badge : badge.id;
        const badgeMeta = LEARNING_BADGES.find((item) => item.id === id);
        return { ...badgeMeta, earnedAt: typeof badge === 'string' ? new Date().toISOString() : badge.earnedAt };
      })
      .filter((badge) => badge.id);

    if (newlyEarnedBadges.length > 0) {
      const addToast = useSettingsStore.getState().addToast;
      const badgeNames = newlyEarnedBadges.map((badge) => badge.name).join(', ');
      addToast({
        type: 'success',
        title: newlyEarnedBadges.length === 1 ? 'New badge unlocked!' : 'New badges unlocked!',
        message: `Congratulations! You earned ${badgeNames}.`,
      });
    }

    set({ earnedBadges, newlyEarnedBadges });
    return earnedBadges;
  },

  clearNewlyEarnedBadges: () => set({ newlyEarnedBadges: [] }),

  syncToBackend: async (userId) => {
    if (!userId) return;
    try {
      await api.updateLearningProgress({ ...buildPayload(get()), userId });
      set({ error: null });
    } catch (err) {
      console.warn('Learning sync failed:', err);
      set({ error: null });
    }
  },

  resetLearningProgress: async () => {
    const { userId } = get();
    set({ ...emptyState, userId });
    localStorage.removeItem(STORAGE_KEY);
    if (userId) {
      try {
        await api.resetLearningProgress(userId);
      } catch (err) {
        console.warn('Learning reset backend failed:', err);
      }
    }
  },
}));
