import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { aiGenerateSchema } from '../utils/validators';
import { generateWords, checkAiStatus } from '../services/gigachat-service';

const router: Router = Router();

// Публичный маршрут — без авторизации
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await checkAiStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Всё что ниже — требует авторизации
router.use(authenticate);
router.use(requireRole('user', 'admin'));

router.post('/generate-words', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = aiGenerateSchema.parse(req.body);
    const result = await generateWords(data.topic, data.count);
    res.json({
      topic: data.topic,
      words: result.words,
      generatedAt: new Date().toISOString(),
      isFallback: result.isFallback,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Неверные данные', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;