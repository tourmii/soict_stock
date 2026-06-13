import { Router } from 'express';
import { getDb } from '../services/db.js';
import { generateChatbotReply } from '../services/chatbotService.js';

const router = Router();
const COLLECTION = 'chatbot_conversations';

function validUserId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0 && userId.length <= 128;
}

router.post('/message', async (req, res) => {
  const { userId = null, message, context = {} } = req.body;
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });
  const response = await generateChatbotReply({ message, context });

  if (userId && validUserId(userId)) {
    try {
      const db = getDb();
      const now = new Date().toISOString();
      const userMessage = { id: `${Date.now()}-user`, role: 'user', content: message, createdAt: now };
      const assistantMessage = { id: `${Date.now()}-assistant`, role: 'assistant', content: response.reply, intent: response.intent, suggestions: response.suggestions, cards: response.cards, metadata: response.metadata, createdAt: now };
      await db.collection(COLLECTION).updateOne(
        { userId },
        { $push: { messages: { $each: [userMessage, assistantMessage], $slice: -100 } }, $set: { updatedAt: now }, $setOnInsert: { userId, createdAt: now } },
        { upsert: true }
      );
    } catch {
      // Response should still work if history persistence fails.
    }
  }

  res.json(response);
});

router.get('/history', async (req, res) => {
  const { userId } = req.query;
  if (!validUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  try {
    const db = getDb();
    const doc = await db.collection(COLLECTION).findOne({ userId });
    res.json({ userId, messages: doc?.messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/history', async (req, res) => {
  const { userId, messages = [] } = req.body;
  if (!validUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' });
  try {
    const db = getDb();
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { userId },
      { $set: { userId, messages: messages.slice(-100), updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    res.json({ userId, messages: messages.slice(-100) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history', async (req, res) => {
  const { userId } = req.query;
  if (!validUserId(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  try {
    const db = getDb();
    await db.collection(COLLECTION).updateOne(
      { userId },
      { $set: { messages: [], updatedAt: new Date().toISOString() }, $setOnInsert: { userId, createdAt: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ userId, messages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
