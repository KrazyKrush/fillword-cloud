import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

// Хранилище сессий гостей в памяти
const guestSessions: Map<string, {
  fillwordId: number;
  startedAt: Date;
  foundWords: string[];
  errors: number;
}> = new Map();

export async function startSolve(userId: number, fillwordId: number): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
  if (!fillword) throw new Error('Филворд не найден');
  if (fillword.status !== 'published') throw new Error('Филворд недоступен');

  // ГОСТЬ — не трогаем БД
  if (userId === 0) {
    const sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    guestSessions.set(sessionId, {
      fillwordId,
      startedAt: new Date(),
      foundWords: [],
      errors: 0,
    });

    return {
      resultId: sessionId,
      fillwordId,
      startedAt: new Date().toISOString(),
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
    };
  }

  // ПОЛЬЗОВАТЕЛЬ — создаём запись в БД
  const existing = await prisma.solveResult.findUnique({
    where: { userId_fillwordId: { userId, fillwordId } },
  });

  if (existing) {
    // Обновляем существующую сессию
    await prisma.solveResult.update({
      where: { id: existing.id },
      data: { timeSeconds: 0, isCompleted: false, wordsFoundCount: 0, errorsCount: 0 },
    });

    return {
      resultId: existing.id,
      fillwordId: existing.fillwordId,
      startedAt: new Date().toISOString(),
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
    };
  }

  const result = await prisma.solveResult.create({
    data: { userId, fillwordId, timeSeconds: 0, isCompleted: false, wordsFoundCount: 0 },
  });

  return {
    resultId: result.id,
    fillwordId: result.fillwordId,
    startedAt: result.startedAt.toISOString(),
    totalWordsCount: fillword.totalWordsCount,
    isCompleted: false,
  };
}

export async function checkWord(
  resultId: string | number,
  word: string,
  cells: Array<{ row: number; col: number }>
): Promise<any> {
  const idStr = String(resultId);

  // ГОСТЬ
  if (idStr.startsWith('guest_')) {
    const session = guestSessions.get(idStr);
    if (!session) throw new Error('Сессия не найдена');

    const fillword = await prisma.fillword.findUnique({
      where: { id: session.fillwordId },
      include: { words: { include: { path: { orderBy: { step: 'asc' } } } } },
    });

    if (!fillword) throw new Error('Филворд не найден');

    const upperWord = word.toUpperCase();
    const foundWord = fillword.words.find(w => w.word === upperWord);

    if (!foundWord || session.foundWords.includes(upperWord)) {
      session.errors++;
      return {
        isCorrect: false,
        wordsFoundCount: session.foundWords.length,
        totalWordsCount: fillword.totalWordsCount,
        isCompleted: false,
        timeSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
        errorsCount: session.errors,
      };
    }

    // Проверка ячеек
    let cellsMatch = false;
    if (foundWord.path && foundWord.path.length > 0) {
      const expected = foundWord.path.map(p => ({ row: p.row, col: p.col }));
      cellsMatch = cells.length === expected.length && cells.every((c, i) => c.row === expected[i].row && c.col === expected[i].col);
    } else {
      const expected: Array<{ row: number; col: number }> = [];
      let row = foundWord.startRow;
      let col = foundWord.startCol;
      for (let i = 0; i < foundWord.word.length; i++) {
        expected.push({ row, col });
        switch (foundWord.direction) {
          case 'H': col++; break;
          case 'HR': col--; break;
          case 'V': row++; break;
          case 'VR': row--; break;
          case 'D': row++; col++; break;
          case 'DR': row--; col--; break;
        }
      }
      cellsMatch = cells.length === expected.length && cells.every((c, i) => c.row === expected[i].row && c.col === expected[i].col);
    }

    if (!cellsMatch) {
      session.errors++;
      return {
        isCorrect: false,
        wordsFoundCount: session.foundWords.length,
        totalWordsCount: fillword.totalWordsCount,
        isCompleted: false,
        timeSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
        errorsCount: session.errors,
      };
    }

    session.foundWords.push(upperWord);
    const timeSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const isCompleted = session.foundWords.length >= fillword.totalWordsCount;

    return {
      isCorrect: true,
      wordFound: foundWord.word,
      wordsFoundCount: session.foundWords.length,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted,
      timeSeconds,
      errorsCount: session.errors,
    };
  }

  // ПОЛЬЗОВАТЕЛЬ
  const numericId = parseInt(idStr);
  const result = await prisma.solveResult.findUnique({
    where: { id: numericId },
    include: { fillword: { include: { words: { include: { path: { orderBy: { step: 'asc' } } } } } } },
  });

  if (!result) throw new Error('Сессия не найдена');

  const fillword = result.fillword;
  const upperWord = word.toUpperCase();
  const foundWord = fillword.words.find(w => w.word === upperWord);

  if (!foundWord) {
    const updated = await prisma.solveResult.update({
      where: { id: numericId },
      data: { errorsCount: { increment: 1 } },
    });
    return {
      isCorrect: false,
      wordsFoundCount: result.wordsFoundCount,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
      timeSeconds: Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000),
      errorsCount: updated.errorsCount,
    };
  }

  let cellsMatch = false;
  if (foundWord.path && foundWord.path.length > 0) {
    const expected = foundWord.path.map(p => ({ row: p.row, col: p.col }));
    cellsMatch = cells.length === expected.length && cells.every((c, i) => c.row === expected[i].row && c.col === expected[i].col);
  } else {
    const expected: Array<{ row: number; col: number }> = [];
    let row = foundWord.startRow;
    let col = foundWord.startCol;
    for (let i = 0; i < foundWord.word.length; i++) {
      expected.push({ row, col });
      switch (foundWord.direction) {
        case 'H': col++; break;
        case 'HR': col--; break;
        case 'V': row++; break;
        case 'VR': row--; break;
        case 'D': row++; col++; break;
        case 'DR': row--; col--; break;
      }
    }
    cellsMatch = cells.length === expected.length && cells.every((c, i) => c.row === expected[i].row && c.col === expected[i].col);
  }

  if (!cellsMatch) {
    const updated = await prisma.solveResult.update({
      where: { id: numericId },
      data: { errorsCount: { increment: 1 } },
    });
    return {
      isCorrect: false,
      wordsFoundCount: result.wordsFoundCount,
      totalWordsCount: fillword.totalWordsCount,
      isCompleted: false,
      timeSeconds: Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000),
      errorsCount: updated.errorsCount,
    };
  }

  const timeSeconds = Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000);
  const wordsFoundCount = result.wordsFoundCount + 1;
  const isCompleted = wordsFoundCount >= fillword.totalWordsCount;

  await prisma.solveResult.update({
    where: { id: numericId },
    data: { wordsFoundCount, timeSeconds, isCompleted, completedAt: isCompleted ? new Date() : null },
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

export async function getLeaderboard(fillwordId: number, limit: number = 100): Promise<any> {
  const fillword = await prisma.fillword.findUnique({ where: { id: fillwordId } });
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
    leaderboard: results.map((r, i) => ({
      rank: i + 1,
      username: r.user.username,
      timeSeconds: r.timeSeconds,
      errorsCount: r.errorsCount,
      completedAt: r.completedAt,
    })),
  };
}