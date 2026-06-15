import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

export async function getModerationQueue(page: number = 1, size: number = 20): Promise<any> {
  const where: any = { status: 'pending' };

  const [content, totalElements] = await Promise.all([
    prisma.fillword.findMany({
      where,
      include: { creator: { select: { username: true } } },
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

export async function getAllFillwords(page: number = 1, size: number = 20): Promise<any> {
  const where: any = { status: 'published' };

  const [content, totalElements] = await Promise.all([
    prisma.fillword.findMany({
      where,
      include: { creator: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
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
      viewsCount: f.viewsCount,
      createdAt: f.createdAt,
    })),
    totalPages: Math.ceil(totalElements / size),
    totalElements,
    currentPage: page,
  };
}

export async function approveFillword(fillwordId: number, moderatorId: number): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'pending') throw new Error('Филворд не находится на модерации');

  const updated = await prisma.fillword.update({
    where: { id: fillwordId },
    data: {
      status: 'published',
      moderatorId,
      moderatedAt: new Date(),
      publishedAt: new Date(),
      deletedReason: null,
      rejectionReason: null,
    },
  });

  return { id: updated.id, status: updated.status, moderatedAt: updated.moderatedAt };
}

export async function rejectFillword(fillwordId: number, moderatorId: number, reason: string): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'pending') throw new Error('Филворд не находится на модерации');
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

export async function deletePublishedFillword(
  fillwordId: number,
  moderatorId: number,
  reason: string
): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'published') throw new Error('Можно удалить только опубликованный филворд');
  if (!reason.trim()) throw new Error('Необходимо указать причину удаления');

  const updated = await prisma.fillword.update({
    where: { id: fillwordId },
    data: {
      status: 'rejected',
      deletedReason: reason.trim(),
      rejectionReason: `Удалён администратором. Причина: ${reason.trim()}`,
      moderatorId,
      moderatedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    deletedReason: updated.deletedReason,
    message: 'Филворд удалён из каталога',
  };
}