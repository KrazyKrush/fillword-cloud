import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import fillwordRoutes from './routes/fillwords';
import moderationRoutes from './routes/moderation';
import solveRoutes from './routes/solve';
import aiRoutes from './routes/ai';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много попыток входа, попробуйте позже' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/fillwords', fillwordRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/solve', solveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req: express.Request, res: express.Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
);

app.listen(PORT, (): void => {
  console.log('============================================');
  console.log('  🚀 FillWord Cloud API (SQLite)');
  console.log(`  http://localhost:${PORT}`);
  console.log('============================================');
});

export default app;