import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth-service';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '../utils/validators';

const router: Router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data.username, data.password);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Неверные данные', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.username, data.password);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Неверные данные', details: error.errors });
    } else {
      res.status(401).json({ error: error.message });
    }
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Выход выполнен успешно' });
});

export default router;