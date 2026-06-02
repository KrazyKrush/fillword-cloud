import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { createFillwordSchema } from '../utils/validators';
import {
  getPublishedFillwords,
  getFillwordById,
  createFillword,
  getUserFillwords,
  deleteFillword,
  updateFillword,
} from '../services/fillword-service';

const router: Router = Router();

// Получение каталога опубликованных филвордов
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, difficulty, page = '1', size = '20' } = req.query;
    const result = await getPublishedFillwords({
      topic: (topic as string) || '',
      difficulty: (difficulty as string) || '',
      page: parseInt(page as string) || 1,
      size: parseInt(size as string) || 20,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error in GET /fillwords:', error);
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
});

// Получение своих филвордов (включая на модерации)
router.get(
  '/my',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('GET /fillwords/my - userId:', req.user?.userId);
      const { status, page = '1', size = '20' } = req.query;
      const result = await getUserFillwords(
        req.user!.userId,
        (status as string) || undefined,
        parseInt(page as string) || 1,
        parseInt(size as string) || 20
      );
      console.log('User fillwords result:', result);
      res.json(result);
    } catch (error: any) {
      console.error('Error in GET /fillwords/my:', error);
      res.status(500).json({ error: error.message || 'Ошибка сервера' });
    }
  }
);

// Получение филворда по ID
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const fillwordId = parseInt(req.params.id);
    if (isNaN(fillwordId)) {
      res.status(400).json({ error: 'Неверный ID филворда' });
      return;
    }

    const fillword = await getFillwordById(fillwordId);

    // Если филворд не опубликован, доступ только автору или админу
    if (fillword.status !== 'published') {
      const isOwner = req.user?.userId === fillword.creatorId;
      const isAdmin = req.user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Филворд недоступен' });
        return;
      }
    }

    res.json(fillword);
  } catch (error: any) {
    console.error('Error in GET /fillwords/:id:', error);
    res.status(404).json({ error: error.message || 'Филворд не найден' });
  }
});

// Создание филворда
router.post(
  '/',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = createFillwordSchema.parse(req.body);
      console.log('Creating fillword:', data.title, 'by user:', req.user?.userId);
      const result = await createFillword(req.user!.userId, data);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error in POST /fillwords:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Неверные данные', details: error.errors });
      } else {
        res.status(400).json({ error: error.message || 'Ошибка создания филворда' });
      }
    }
  }
);

// Обновление филворда
router.put(
  '/:id',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const fillwordId = parseInt(req.params.id);
      if (isNaN(fillwordId)) {
        res.status(400).json({ error: 'Неверный ID филворда' });
        return;
      }
      console.log('Updating fillword:', fillwordId, 'by user:', req.user?.userId);
      const result = await updateFillword(fillwordId, req.user!.userId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in PUT /fillwords/:id:', error);
      res.status(400).json({ error: error.message || 'Ошибка обновления филворда' });
    }
  }
);

// Удаление филворда
router.delete(
  '/:id',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const fillwordId = parseInt(req.params.id);
      if (isNaN(fillwordId)) {
        res.status(400).json({ error: 'Неверный ID филворда' });
        return;
      }
      const isAdmin = req.user!.role === 'admin';
      console.log('Deleting fillword:', fillwordId, 'by user:', req.user?.userId, 'isAdmin:', isAdmin);
      const result = await deleteFillword(fillwordId, req.user!.userId, isAdmin);
      res.json(result);
    } catch (error: any) {
      console.error('Error in DELETE /fillwords/:id:', error);
      res.status(400).json({ error: error.message || 'Ошибка удаления филворда' });
    }
  }
);

export default router;