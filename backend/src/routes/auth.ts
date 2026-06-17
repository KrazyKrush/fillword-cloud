import { Router, Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  toggleUserBlock,
} from '../services/auth-service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
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

router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getUserProfile(req.user!.userId);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get(
  '/users',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', size = '20' } = req.query;
      const result = await getAllUsers(
        parseInt(page as string) || 1,
        parseInt(size as string) || 20
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put(
  '/users/:id/block',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { isActive } = req.body;
      const result = await toggleUserBlock(parseInt(req.params.id), isActive);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Запрет публикации (mute)
router.put(
  '/users/:id/mute',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { minutes, reason } = req.body;
      if (!minutes || !reason) {
        res.status(400).json({ error: 'Укажите минуты и причину' });
        return;
      }
      const result = await muteUser(parseInt(req.params.id), minutes, reason, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Снятие запрета публикации
router.put(
  '/users/:id/unmute',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await unmuteUser(parseInt(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;