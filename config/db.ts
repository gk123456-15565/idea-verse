import mongoose from 'mongoose';

export let isConnectedToMongo = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'your_mongodb_connection_string' || uri.trim() === '') {
    console.log('ℹ️ [IDEAVERSE] No MONGODB_URI configured. Running with resilient local persistent data store.');
    isConnectedToMongo = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    isConnectedToMongo = true;
    console.log(`✅ [IDEAVERSE] MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    const error = err as Error;
    console.error(`⚠️ [IDEAVERSE] MongoDB Connection failed: ${error.message}`);
    console.log('ℹ️ [IDEAVERSE] Falling back to local data store so the application continues to run smoothly.');
    isConnectedToMongo = false;
    return false;
  }
}

export default connectDB;
