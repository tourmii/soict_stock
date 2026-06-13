/**
 * Auth routes — sign up / sign in / profile / session
 * Passwords are hashed with bcryptjs. User data stored in MongoDB `users` collection.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../services/db.js';

const router = Router();
const SALT_ROUNDS = 10;

/* ─── Sign Up ─────────────────────────────────────── */
router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const users = db.collection('users');

  // Check if email already exists
  const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();
  const userId = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

  const user = {
    _id: userId,
    email: email.toLowerCase(),
    passwordHash,
    display_name: displayName || email.split('@')[0],
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);

  // Create default portfolio for this user
  await db.collection('portfolios').insertOne({
    userId,
    cash: 150000,
    initialCash: 150000,
    holdings: {},
    createdAt: now,
  });

  // Return user info (never return passwordHash)
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ user: { ...safeUser, id: userId } });
});

/* ─── Sign In ─────────────────────────────────────── */
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Update last login
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date().toISOString() } }
  );

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: { ...safeUser, id: user._id } });
});

/* ─── Get Profile ─────────────────────────────────── */
router.get('/profile', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const db = getDb();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: { ...safeUser, id: user._id } });
});

/* ─── Update Display Name ────────────────────────── */
router.put('/profile', async (req, res) => {
  const { userId, displayName } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const db = getDb();
  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { display_name: displayName, updatedAt: new Date().toISOString() } }
  );

  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: { ...safeUser, id: user._id } });
});

export default router;
