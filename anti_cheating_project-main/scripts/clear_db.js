import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'proctorAi';

if (!uri) {
  console.error('MONGO_URI not set in .env.local');
  process.exit(1);
}

async function clear() {
  const client = new MongoClient(uri, { serverApi: { version: '1' } });
  try {
    await client.connect();
    const db = client.db(dbName);
    const examsResult = await db.collection('exams').deleteMany({});
    const reportsResult = await db.collection('reports').deleteMany({});
    console.log(`Deleted ${examsResult.deletedCount} exams and ${reportsResult.deletedCount} reports from database ${dbName}`);
  } catch (err) {
    console.error('Failed to clear database:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

clear();
