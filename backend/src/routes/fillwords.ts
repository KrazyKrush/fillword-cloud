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

router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const topic = req.query.topic as string || '';
    const difficulty = req.query.difficulty as string || '';
    const search = req.query.search as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 20;

    console.log('Catalog request:', { topic, difficulty, search, page, size });

    const result = await getPublishedFillwords({
      topic,
      difficulty,
      search,
      page,
      size,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error in catalog:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/my',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, page = '1', size = '20' } = req.query;
      const result = await getUserFillwords(
        req.user!.userId,
        status as string || undefined,
        parseInt(page as string) || 1,
        parseInt(size as string) || 20
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const fillword = await getFillwordById(parseInt(req.params.id));
    if (fillword.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      res.status(403).json({ error: 'Филворд недоступен' });
      return;
    }
    res.json(fillword);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  '/',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await getUserProfile(req.user!.userId);
      if (profile.muteMessage) {
        res.status(403).json({ error: profile.muteMessage });
        return;
      }

      const data = createFillwordSchema.parse(req.body);
      const result = await createFillword(req.user!.userId, data);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Неверные данные', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await updateFillword(parseInt(req.params.id), req.user!.userId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requireRole('user', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const isAdmin = req.user!.role === 'admin';
      const result = await deleteFillword(parseInt(req.params.id), req.user!.userId, isAdmin);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;