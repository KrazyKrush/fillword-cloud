import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { rejectSchema } from '../utils/validators';
import {
  getModerationQueue,
  getAllFillwords,
  approveFillword,
  rejectFillword,
  deletePublishedFillword,
} from '../services/moderation-service';
import { getFillwordById } from '../services/fillword-service';

const router: Router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const size = parseInt((req.query.size as string) || '20');
    const result = await getModerationQueue(page, size);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/published', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const size = parseInt((req.query.size as string) || '20');
    const result = await getAllFillwords(page, size);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/queue/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const fillword = await getFillwordById(parseInt(req.params.id as string));
    res.json(fillword);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/queue/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await approveFillword(parseInt(req.params.id as string), req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/queue/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = rejectSchema.parse(req.body);
    const result = await rejectFillword(parseInt(req.params.id as string), req.user!.userId, data.rejectionReason);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Неверные данные', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});
router.put('/published/:id/delete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Необходимо указать причину удаления' });
      return;
    }
    const result = await deletePublishedFillword(
      parseInt(req.params.id as string),
      req.user!.userId,
      reason.trim()
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;