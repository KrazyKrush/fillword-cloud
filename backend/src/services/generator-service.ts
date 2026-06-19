const CYRILLIC: string = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

export interface PlacedWord {
  word: string;
  direction: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  path?: Array<{ row: number; col: number }>;
}

export function randomChar(): string {
  return CYRILLIC[Math.floor(Math.random() * CYRILLIC.length)];
}

export function getDirections(difficulty: string): string[] {
  const base = ['H', 'V', 'D', 'HR', 'VR', 'DR'];
  if (difficulty === 'easy') return [...base, 'ZH', 'ZV'];
  if (difficulty === 'medium') return [...base, 'ZH', 'ZV'];
  return [...base, 'ZH', 'ZV'];
}

function buildSnakePath(
  word: string,
  startRow: number,
  startCol: number,
  type: 'ZH' | 'ZV',
  height: number,
  width: number
): Array<{ row: number; col: number }> | null {
  const path: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
  let row = startRow;
  let col = startCol;

  for (let i = 1; i < word.length; i++) {
    let nextRow = row;
    let nextCol = col;

    if (type === 'ZH') {
      if (i % 2 === 1) nextCol = col + 1;
      else nextRow = row + 1;
    } else {
      if (i % 2 === 1) nextRow = row + 1;
      else nextCol = col + 1;
    }

    if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) return null;
    path.push({ row: nextRow, col: nextCol });
    row = nextRow;
    col = nextCol;
  }

  return path;
}

function isSnakePathValid(
  grid: (string | null)[][],
  word: string,
  path: Array<{ row: number; col: number }>
): boolean {
  for (let i = 0; i < word.length; i++) {
    const { row, col } = path[i];
    if (grid[row][col] !== null && grid[row][col] !== word[i]) return false;
  }
  return true;
}

export function canPlaceWord(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: string
): boolean {
  const height = grid.length;
  const width = grid[0].length;


  if (direction === 'ZH' || direction === 'ZV') {
    const path = buildSnakePath(word, startRow, startCol, direction as 'ZH' | 'ZV', height, width);
    if (!path) return false;
    return isSnakePathValid(grid, word, path);
  }

  let row = startRow;
  let col = startCol;

  for (let i = 0; i < word.length; i++) {
    if (row < 0 || row >= height || col < 0 || col >= width) return false;
    if (grid[row][col] !== null && grid[row][col] !== word[i]) return false;
    switch (direction) {
      case 'H': col++; break;
      case 'HR': col--; break;
      case 'V': row++; break;
      case 'VR': row--; break;
      case 'D': row++; col++; break;
      case 'DR': row--; col--; break;
    }
  }
  return true;
}

export function placeWordOnGrid(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: string
): Array<{ row: number; col: number }> {
  const height = grid.length;
  const width = grid[0].length;


  if (direction === 'ZH' || direction === 'ZV') {
    const path = buildSnakePath(word, startRow, startCol, direction as 'ZH' | 'ZV', height, width);
    if (path) {
      for (let i = 0; i < word.length; i++) {
        const { row, col } = path[i];
        if (grid[row][col] === null) {
          grid[row][col] = word[i];
        }
      }
      return path;
    }
    return [];
  }

  const path: Array<{ row: number; col: number }> = [];
  let row = startRow;
  let col = startCol;

  for (let i = 0; i < word.length; i++) {
    if (grid[row][col] === null) {
      grid[row][col] = word[i];
    }
    path.push({ row, col });
    switch (direction) {
      case 'H': col++; break;
      case 'HR': col--; break;
      case 'V': row++; break;
      case 'VR': row--; break;
      case 'D': row++; col++; break;
      case 'DR': row--; col--; break;
    }
  }
  return path;
}

export function calculateDifficulty(width: number, height: number, wordCount: number): string {
  if (width <= 10 && height <= 10 && wordCount <= 7) return 'easy';
  if (width <= 15 && height <= 15 && wordCount <= 12) return 'medium';
  return 'hard';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wouldBreakExisting(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: string,
  placedWords: PlacedWord[]
): boolean {
  const gridCopy: (string | null)[][] = grid.map(row => [...row]);
  placeWordOnGrid(gridCopy, word, startRow, startCol, direction);


  for (const pw of placedWords) {
    if (!canPlaceWord(gridCopy, pw.word, pw.startRow, pw.startCol, pw.direction)) {
      return true; 
    }
  }
  return false;
}

export function generateFillword(
  width: number,
  height: number,
  words: string[]
): { grid: string[][]; placedWords: PlacedWord[]; error?: string } {
  const upperWords: string[] = words.map(w => w.toUpperCase().trim());
  const sortedWords: string[] = [...upperWords].sort((a, b) => b.length - a.length);
  const difficulty: string = calculateDifficulty(width, height, sortedWords.length);
  const directions: string[] = getDirections(difficulty);

  const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  const placedWords: PlacedWord[] = [];
  const usedDirections: Record<string, number> = {};

  for (const word of sortedWords) {
    let placed = false;


    const allPositions: Array<{ row: number; col: number; dir: string }> = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        for (const dir of directions) {
          if (canPlaceWord(grid, word, r, c, dir)) {
            allPositions.push({ row: r, col: c, dir });
          }
        }
      }
    }

    const shuffled = shuffle(allPositions);

    shuffled.sort((a, b) => {
      const aUsed = usedDirections[a.dir] || 0;
      const bUsed = usedDirections[b.dir] || 0;
      if (aUsed !== bUsed) return aUsed - bUsed;

      const aSnake = a.dir.startsWith('Z') ? 0 : 1;
      const bSnake = b.dir.startsWith('Z') ? 0 : 1;
      return aSnake - bSnake;
    });

    for (const pos of shuffled) {
      if (wouldBreakExisting(grid, word, pos.row, pos.col, pos.dir, placedWords)) {
        continue;
      }

      if (canPlaceWord(grid, word, pos.row, pos.col, pos.dir)) {
        const path = placeWordOnGrid(grid, word, pos.row, pos.col, pos.dir);
        const last = path[path.length - 1];
        placedWords.push({
          word,
          direction: pos.dir,
          startRow: pos.row,
          startCol: pos.col,
          endRow: last.row,
          endCol: last.col,
          path,
        });
        usedDirections[pos.dir] = (usedDirections[pos.dir] || 0) + 1;
        placed = true;
        break;
      }
    }

    if (!placed) {
      return {
        grid: [],
        placedWords: [],
        error: `Невозможно разместить слово "${word}". Попробуйте изменить слова или увеличить сетку.`,
      };
    }
  }

  const finalGrid: string[][] = grid.map(row => row.map(cell => cell || randomChar()));
  return { grid: finalGrid, placedWords };
}