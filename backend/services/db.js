/**
 * MongoDB connection singleton
 * Database: soict_stock
 */
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'soict_stock';

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

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
  await db.collection('learning_progress').createIndex({ userId: 1 }, { unique: true });

  console.log(`✅ Connected to MongoDB: ${DB_NAME}`);
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
