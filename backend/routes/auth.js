import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../services/db.js';
import { generateVerificationToken, sendVerificationEmail } from '../services/emailService.js';

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

  const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();
  const userId = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const user = {
    _id: userId,
    email: email.toLowerCase(),
    passwordHash,
    display_name: displayName || email.split('@')[0],
    emailVerified: false,
    verificationToken,
    verificationExpires,
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);

  await db.collection('portfolios').insertOne({
    userId,
    cash: 150000,
    initialCash: 150000,
    holdings: {},
    createdAt: now,
  });

  try {
    await sendVerificationEmail(email.toLowerCase(), verificationToken);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
  }

  res.status(201).json({ message: 'Account created! Please check your email to verify your account before signing in.' });
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

  // Block unverified users — treat missing field as verified (legacy accounts)
  if (user.emailVerified === false) {
    return res.status(403).json({ error: 'Please verify your email before signing in.', code: 'email_not_verified' });
  }

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date().toISOString() } }
  );

  const { passwordHash: _, verificationToken: __, verificationExpires: ___, ...safeUser } = user;
  res.json({ user: { ...safeUser, id: user._id } });
});

/* ─── Verify Email ────────────────────────────────── */
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  const db = getDb();
  const user = await db.collection('users').findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired verification link.' });
  }

  if (new Date(user.verificationExpires) < new Date()) {
    return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
  }

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { emailVerified: true }, $unset: { verificationToken: '', verificationExpires: '' } }
  );

  const updatedUser = await db.collection('users').findOne({ _id: user._id });
  const { passwordHash: _, ...safeUser } = updatedUser;
  res.json({ user: { ...safeUser, id: user._id }, message: 'Email verified! You can now sign in.' });
});

/* ─── Resend Verification ─────────────────────────── */
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const db = getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });

  // Always respond with success to prevent email enumeration
  if (!user || user.emailVerified !== false) {
    return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  }

  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { verificationToken, verificationExpires } }
  );

  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
  }

  res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
});

/* ─── Get Profile ─────────────────────────────────── */
router.get('/profile', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const db = getDb();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, verificationToken: __, verificationExpires: ___, ...safeUser } = user;
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

  const { passwordHash: _, verificationToken: __, verificationExpires: ___, ...safeUser } = user;
  res.json({ user: { ...safeUser, id: user._id } });
});

export default router;
