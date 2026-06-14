import { connectDB, getDb } from './services/db.js';

async function main() {
  await connectDB();
  const db = getDb();
  await db.collection('contests').deleteMany({});
  await db.collection('contest_portfolios').deleteMany({});
  await db.collection('contest_transactions').deleteMany({});
  console.log('Dropped all contest data!');
  process.exit(0);
}

main().catch(console.error);
