import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { connectDB } from './config/db';
import { seedDatabase } from './data/seedDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`[EigenMinds Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
