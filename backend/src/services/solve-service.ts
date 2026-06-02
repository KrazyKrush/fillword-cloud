import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

export async function startSolve(
  userId: number,
  fillwordId: number
): Promise<any> {
  const fillword = await prisma.fillword.findUnique({
    where: { id: fillwordId },
  });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'published') throw new Error('Филворд недоступен');

  const existing = await prisma.solveResult.findUnique({
    where: {
      userId_fillwordId: { userId, fillwordId },
    },
  });

  if (existing) {
    return {
      resultId: existing.id,
      fillwordId: existing.fillwordId,
      startedAt: existing.startedAt,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: existing.isCompleted,
    };
  }

  const result = await prisma.solveResult.create({
    data: {
      userId,
      fillwordId,
      timeSeconds: 0,
      isCompleted: false,
      wordsFoundCount: 0,
    },
  });

  return {
    resultId: result.id,
    fillwordId: result.fillwordId,
    startedAt: result.startedAt,
    totalWordsCount: fillword.totalWordsCount,
    isCompleted: false,
  };
}

export async function checkWord(
  resultId: number,
  word: string,
  cells: Array<{ row: number; col: number }>
): Promise<any> {
  const result = await prisma.solveResult.findUnique({
    where: { id: resultId },
    include: { fillword: { include: { words: true } } },
  });

  if (!result) throw new Error('Сессия разгадывания не найдена');
  if (result.isCompleted) throw new Error('Филворд уже разгадан');

  const fillword = result.fillword;
  const foundWord = fillword.words.find(
    (w: any) => w.word === word.toUpperCase()
  );

  if (!foundWord) {
    const updated = await prisma.solveResult.update({
      where: { id: resultId },
      data: { errorsCount: { increment: 1 } },
    });

    return {
      isCorrect: false,
      wordsFoundCount: result.wordsFoundCount,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
      timeSeconds: Math.floor(
        (Date.now() - new Date(result.startedAt).getTime()) / 1000
      ),
      errorsCount: updated.errorsCount,
    };
  }

  const expectedCells: Array<{ row: number; col: number }> = [];
  let row: number = foundWord.startRow;
  let col: number = foundWord.startCol;

  for (let i: number = 0; i < foundWord.word.length; i++) {
    expectedCells.push({ row, col });
    switch (foundWord.direction) {
      case 'H': col++; break;
      case 'HR': col--; break;
      case 'V': row++; break;
      case 'VR': row--; break;
      case 'D': row++; col++; break;
      case 'DR': row--; col--; break;
    }
  }

  const cellsMatch: boolean =
    cells.length === expectedCells.length &&
    cells.every(
      (c: any, i: number) =>
        c.row === expectedCells[i].row && c.col === expectedCells[i].col
    );

  if (!cellsMatch) {
    const updated = await prisma.solveResult.update({
      where: { id: resultId },
      data: { errorsCount: { increment: 1 } },
    });

    return {
      isCorrect: false,
      wordsFoundCount: result.wordsFoundCount,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
      timeSeconds: Math.floor(
        (Date.now() - new Date(result.startedAt).getTime()) / 1000
      ),
      errorsCount: updated.errorsCount,
    };
  }

  const timeSeconds: number = Math.floor(
    (Date.now() - new Date(result.startedAt).getTime()) / 1000
  );
  const wordsFoundCount: number = result.wordsFoundCount + 1;
  const isCompleted: boolean = wordsFoundCount >= fillword.totalWordsCount;

  await prisma.solveResult.update({
    where: { id: resultId },
    data: {
      wordsFoundCount,
      timeSeconds,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return {
    isCorrect: true,
    wordFound: foundWord.word,
    wordsFoundCount,
    totalWordsCount: fillword.totalWordsCount,
    isCompleted,
    timeSeconds,
    errorsCount: result.errorsCount,
  };
}

export async function getLeaderboard(
  fillwordId: number,
  limit: number = 100
): Promise<any> {
  const fillword = await prisma.fillword.findUnique({
    where: { id: fillwordId },
  });
  if (!fillword) throw new Error('Филворд не найден');

  const results = await prisma.solveResult.findMany({
    where: { fillwordId, isCompleted: true },
    include: { user: { select: { username: true } } },
    orderBy: [{ timeSeconds: 'asc' }, { completedAt: 'asc' }],
    take: limit,
  });

  return {
    fillwordId: fillword.id,
    fillwordTitle: fillword.title,
    difficulty: fillword.difficulty,
    leaderboard: results.map((r: any, index: number) => ({
      rank: index + 1,
      username: r.user.username,
      timeSeconds: r.timeSeconds,
      errorsCount: r.errorsCount,
      completedAt: r.completedAt,
    })),
  };
}