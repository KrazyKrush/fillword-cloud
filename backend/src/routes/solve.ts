import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth';
import { checkWordSchema } from '../utils/validators';
import * as solveService from '../services/solve-service';

const router: Router = Router();

router.post(
  '/:fillwordId/start',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId: number = req.user?.userId || 0;
      const result = await solveService.startSolve(userId, parseInt(req.params.fillwordId));
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/:resultId/check-word',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = checkWordSchema.parse(req.body);
      const result = await solveService.checkWord(parseInt(req.params.resultId), data.word, data.cells);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Неверные данные', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
);

router.get(
  '/leaderboard/:fillwordId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await solveService.getLeaderboard(parseInt(req.params.fillwordId));
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

export default router;