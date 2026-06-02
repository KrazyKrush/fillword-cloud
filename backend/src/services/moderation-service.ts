import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

export async function getModerationQueue(
  page: number = 1,
  size: number = 20
): Promise<any> {
  const where: any = { status: 'pending' };

  const [content, totalElements] = await Promise.all([
    prisma.fillword.findMany({
      where,
      include: {
        creator: { select: { username: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.fillword.count({ where }),
  ]);

  return {
    content: content.map((f: any) => ({
      id: f.id,
      title: f.title,
      topic: f.topic,
      difficulty: f.difficulty,
      creatorUsername: f.creator.username,
      totalWordsCount: f.totalWordsCount,
      createdAt: f.createdAt,
    })),
    totalInQueue: totalElements,
    totalPages: Math.ceil(totalElements / size),
    currentPage: page,
  };
}

export async function approveFillword(
  fillwordId: number,
  moderatorId: number
): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'pending') throw new Error('Филворд не на модерации');

  const updated = await prisma.fillword.update({
    where: { id: fillwordId },
    data: {
      status: 'published',
      moderatorId,
      moderatedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    moderatedAt: updated.moderatedAt,
  };
}

export async function rejectFillword(
  fillwordId: number,
  moderatorId: number,
  reason: string
): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'pending') throw new Error('Филворд не на модерации');
  if (!reason.trim()) throw new Error('Необходимо указать причину отклонения');

  const updated = await prisma.fillword.update({
    where: { id: fillwordId },
    data: {
      status: 'rejected',
      rejectionReason: reason.trim(),
      moderatorId,
      moderatedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    rejectionReason: updated.rejectionReason,
    moderatedAt: updated.moderatedAt,
  };
}