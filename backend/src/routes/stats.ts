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

router.get('/top-solvers', async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'all';
    const limit = parseInt(req.query.limit as string) || 20;

    let dateFilter: any = {};
    const now = new Date();
    if (period === 'week') {
      dateFilter = { completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'day') {
      dateFilter = { completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
    }

    const results = await prisma.solveResult.groupBy({
      by: ['userId'],
      where: { isCompleted: true, ...dateFilter },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 100,
    });

    const users = await prisma.user.findMany({
      where: { id: { in: results.map(r => r.userId) } },
      select: { id: true, username: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.username]));

    const leaderboard = results
      .map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        username: userMap.get(r.userId) || 'Неизвестный',
        count: r._count.id,
      }))
      .filter(r => r.count > 0)
      .slice(0, limit);

    res.json({ leaderboard, period });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-speed', async (req: Request, res: Response): Promise<void> => {
  try {
    const difficulty = (req.query.difficulty as string) || 'easy';
    const limit = parseInt(req.query.limit as string) || 20;

    const results = await prisma.solveResult.findMany({
      where: {
        isCompleted: true,
        fillword: { difficulty },
      },
      include: {
        user: { select: { id: true, username: true } },
        fillword: { select: { title: true, difficulty: true } },
      },
      orderBy: [{ timeSeconds: 'asc' }, { completedAt: 'asc' }],
      take: 100,
    });

    const seen = new Set<number>();
    const unique: typeof results = [];
    for (const r of results) {
      if (!seen.has(r.userId)) {
        seen.add(r.userId);
        unique.push(r);
      }
    }

    const leaderboard = unique.slice(0, limit).map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      username: r.user.username,
      timeSeconds: r.timeSeconds,
      fillwordTitle: r.fillword.title,
      errorsCount: r.errorsCount,
    }));

    res.json({ leaderboard, difficulty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;