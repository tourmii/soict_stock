/**
 * MongoDB connection singleton
 */
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });

const MONGODB_URI = process.env.MONGODB_URI;
const FALLBACK_DB_NAME = 'soict_stock';

let client = null;
let db = null;

function getDatabaseName(uri) {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, '').trim();
    return dbName || FALLBACK_DB_NAME;
  } catch {
    return FALLBACK_DB_NAME;
  }
}

export async function connectDB() {
  if (db) return db;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to backend/services/.env before starting the backend.');
  }

  const dbName = getDatabaseName(MONGODB_URI);
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(dbName);

  // Create indexes for performance
  await db.collection('ticks').createIndex({ ticker: 1, time: 1 });
  await db.collection('ticks').createIndex({ ticker: 1, time: -1 });
  await db.collection('orders').createIndex({ userId: 1, status: 1 });
  await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('portfolios').createIndex({ userId: 1 }, { unique: true });
  await db.collection('portfolio_snapshots').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('leaderboard').createIndex({ portfolioValue: -1 });
  await db.collection('news').createIndex({ timestamp: -1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ display_name: 1 });
  await db.collection('users').createIndex({ verificationToken: 1 }, { sparse: true });
  await db.collection('blog_posts').createIndex({ slug: 1 }, { unique: true });
  await db.collection('blog_posts').createIndex({ status: 1 });
  await db.collection('blog_posts').createIndex({ author_id: 1 });
  await db.collection('blog_posts').createIndex({ published_at: -1 });
  await db.collection('blog_posts').createIndex({ rating: -1 });
  await db.collection('blog_posts').createIndex({ upvotes: -1 });
  await db.collection('blog_posts').createIndex({ stock_tags: 1 });
  await db.collection('learning_progress').createIndex({ userId: 1 }, { unique: true });
  await db.collection('chatbot_conversations').createIndex({ userId: 1 }, { unique: true });

  // Contest indexes
  await db.collection('contests').createIndex({ status: 1 });
  await db.collection('contest_portfolios').createIndex({ contestId: 1, userId: 1 }, { unique: true });
  await db.collection('contest_portfolios').createIndex({ contestId: 1, portfolioValue: -1 });

  // Leverage indexes
  await db.collection('leveraged_positions').createIndex({ userId: 1, status: 1 });
  await db.collection('leveraged_positions').createIndex({ contestId: 1, userId: 1 });

  console.log(`✅ Connected to MongoDB: ${dbName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
