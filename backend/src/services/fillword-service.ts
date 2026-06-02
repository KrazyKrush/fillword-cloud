import { PrismaClient } from '@prisma/client';
import { generateFillword, calculateDifficulty } from './generator-service';

const prisma: PrismaClient = new PrismaClient();

export async function getPublishedFillwords(params: {
  topic?: string;
  difficulty?: string;
  page: number;
  size: number;
}): Promise<any> {
  const where: any = { status: 'published' };

  if (params.topic) {
    where.topic = { contains: params.topic, mode: 'insensitive' };
  }
  if (params.difficulty) {
    where.difficulty = params.difficulty;
  }

  const [content, totalElements] = await Promise.all([
    prisma.fillword.findMany({
      where,
      include: {
        creator: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.size,
      take: params.size,
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
    totalPages: Math.ceil(totalElements / params.size),
    totalElements,
    currentPage: params.page,
  };
}

export async function getFillwordById(fillwordId: number): Promise<any> {
  const fillword = await prisma.fillword.findUnique({
    where: { id: fillwordId },
    include: {
      creator: { select: { username: true } },
      moderator: { select: { username: true } },
      cells: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
      words: true,
    },
  });

  if (!fillword) {
    throw new Error('Филворд не найден');
  }

  const grid: string[][] = [];
  for (let r: number = 0; r < fillword.height; r++) {
    grid[r] = [];
    for (let c: number = 0; c < fillword.width; c++) {
      const cell = fillword.cells.find((cell: any) => cell.row === r && cell.col === c);
      grid[r][c] = cell?.letter || '';
    }
  }

  return {
    id: fillword.id,
    title: fillword.title,
    topic: fillword.topic,
    difficulty: fillword.difficulty,
    status: fillword.status,
    width: fillword.width,
    height: fillword.height,
    grid,
    words: fillword.words.map((w: any) => ({
      id: w.id,
      word: w.word,
      direction: w.direction,
      startRow: w.startRow,
      startCol: w.startCol,
      endRow: w.endRow,
      endCol: w.endCol,
    })),
    creatorUsername: fillword.creator.username,
    moderatorUsername: fillword.moderator?.username || null,
    rejectionReason: fillword.rejectionReason,
    isAiGenerated: fillword.isAiGenerated,
    totalWordsCount: fillword.totalWordsCount,
    createdAt: fillword.createdAt,
    moderatedAt: fillword.moderatedAt,
    publishedAt: fillword.publishedAt,
  };
}

export async function createFillword(
  creatorId: number,
  data: {
    title: string;
    topic: string;
    width: number;
    height: number;
    words: string[];
    isAiGenerated?: boolean;
  }
): Promise<any> {
  const result = generateFillword(data.width, data.height, data.words);

  if (result.error) {
    throw new Error(result.error);
  }

  const difficulty: string = calculateDifficulty(
    data.width,
    data.height,
    result.placedWords.length
  );

  const fillword = await prisma.fillword.create({
    data: {
      title: data.title,
      topic: data.topic,
      width: data.width,
      height: data.height,
      difficulty,
      status: 'pending',
      isAiGenerated: data.isAiGenerated || false,
      totalWordsCount: result.placedWords.length,
      creatorId,
      cells: {
        create: result.grid.flatMap((row: string[], r: number) =>
          row.map((letter: string, c: number) => ({
            row: r,
            col: c,
            letter,
          }))
        ),
      },
      words: {
        create: result.placedWords.map((w: any) => ({
          word: w.word,
          direction: w.direction,
          startRow: w.startRow,
          startCol: w.startCol,
          endRow: w.endRow,
          endCol: w.endCol,
        })),
      },
    },
  });

  return {
    id: fillword.id,
    title: fillword.title,
    status: fillword.status,
    difficulty: fillword.difficulty,
    totalWordsCount: fillword.totalWordsCount,
    createdAt: fillword.createdAt,
  };
}

export async function getUserFillwords(
  userId: number,
  status?: string,
  page: number = 1,
  size: number = 20
): Promise<any> {
  const where: any = { creatorId: userId };
  if (status) {
    where.status = status;
  }

  const [content, totalElements] = await Promise.all([
    prisma.fillword.findMany({
      where,
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
      status: f.status,
      difficulty: f.difficulty,
      rejectionReason: f.rejectionReason,
      totalWordsCount: f.totalWordsCount,
      createdAt: f.createdAt,
    })),
    totalPages: Math.ceil(totalElements / size),
    totalElements,
    currentPage: page,
  };
}