import mongoose from 'mongoose';

export async function connectDB(): Promise<typeof mongoose | null> {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eigenminds';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Timeout fast if local DB is not running
    });
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.warn(`[MongoDB] Connection failed (${error.message}). Operating in in-memory / fallback mode.`);
    return null;
  }
}
