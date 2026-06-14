import { Router } from 'express';
import { getDb } from '../services/db.js';

const router = Router();
const COLLECTION = 'learning_progress';

function validateUserId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0 && userId.length <= 128;
}

function defaultProgress(userId) {
  const now = new Date().toISOString();
  return {
    userId,
    lessonProgress: {},
    quizResults: {},
    earnedBadges: [],
    currentLevel: 'Beginner',
    recommendedLessonId: null,
    recommendedChallengeId: null,
    createdAt: now,
    updatedAt: now,
  };
}

function defaultInsertFields(userId, now) {
  return {
    userId,
    earnedBadges: [],
    currentLevel: 'Beginner',
    recommendedLessonId: null,
    recommendedChallengeId: null,
    createdAt: now,
  };
}

router.get('/progress', async (req, res) => {
  const { userId } = req.query;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });

  try {
    const db = getDb();
    let progress = await db.collection(COLLECTION).findOne({ userId });
    if (!progress) {
      progress = defaultProgress(userId);
      await db.collection(COLLECTION).insertOne(progress);
    }
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/progress', async (req, res) => {
  const {
    userId,
    lessonProgress = {},
    quizResults = {},
    earnedBadges = [],
    currentLevel = 'Beginner',
    recommendedLessonId = null,
    recommendedChallengeId = null,
  } = req.body;

  if (!validateUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });

  try {
    const db = getDb();
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { userId },
      {
        $set: {
          userId,
          lessonProgress,
          quizResults,
          earnedBadges: Array.isArray(earnedBadges) ? earnedBadges : [],
          currentLevel,
          recommendedLessonId,
          recommendedChallengeId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    const progress = await db.collection(COLLECTION).findOne({ userId });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lesson/section', async (req, res) => {
  const { userId, lessonId, sectionIndex } = req.body;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  if (!lessonId || !Number.isInteger(sectionIndex) || sectionIndex < 0) {
    return res.status(400).json({ error: 'lessonId and non-negative sectionIndex are required' });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { userId },
      {
        $setOnInsert: defaultInsertFields(userId, now),
        $set: {
          [`lessonProgress.${lessonId}.lessonId`]: lessonId,
          [`lessonProgress.${lessonId}.lastOpenedAt`]: now,
          updatedAt: now,
        },
        $addToSet: { [`lessonProgress.${lessonId}.completedSections`]: sectionIndex },
      },
      { upsert: true }
    );
    const progress = await db.collection(COLLECTION).findOne({ userId });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz/result', async (req, res) => {
  const { userId, quizId, score, totalQuestions } = req.body;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  if (!quizId || !Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return res.status(400).json({ error: 'quizId, score, and totalQuestions are required' });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70;
    const current = await db.collection(COLLECTION).findOne({ userId });
    const existing = current?.quizResults?.[quizId] || { quizId, attempts: [], bestScore: 0, lastScore: 0, completed: false };
    const attempts = [...(existing.attempts || []), { score, totalQuestions, percentage, passed, completedAt: now }];
    const nextResult = {
      ...existing,
      quizId,
      attempts,
      bestScore: Math.max(existing.bestScore || 0, percentage),
      lastScore: percentage,
      completed: existing.completed || passed,
    };

    await db.collection(COLLECTION).updateOne(
      { userId },
      {
        $setOnInsert: defaultInsertFields(userId, now),
        $set: {
          [`quizResults.${quizId}`]: nextResult,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    const progress = await db.collection(COLLECTION).findOne({ userId });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset', async (req, res) => {
  const { userId } = req.body;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });

  try {
    const db = getDb();
    const progress = defaultProgress(userId);
    await db.collection(COLLECTION).replaceOne({ userId }, progress, { upsert: true });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
