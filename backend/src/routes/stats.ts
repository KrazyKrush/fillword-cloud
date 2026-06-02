import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();
const router: Router = Router();

router.get('/platform', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalFillwords, totalSolves] = await Promise.all([
      prisma.user.count(),
      prisma.fillword.count({ where: { status: 'published' } }),
      prisma.solveResult.count({ where: { isCompleted: true } }),
    ]);

    res.json({ totalUsers, totalFillwords, totalSolves });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;