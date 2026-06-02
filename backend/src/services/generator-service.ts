const CYRILLIC: string = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

export interface PlacedWord {
  word: string;
  direction: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function randomChar(): string {
  return CYRILLIC[Math.floor(Math.random() * CYRILLIC.length)];
}

export function getDirections(difficulty: string): string[] {
  switch (difficulty) {
    case 'easy': return ['H', 'V'];
    case 'medium': return ['H', 'V', 'D'];
    case 'hard': return ['H', 'V', 'D', 'HR', 'VR', 'DR'];
    default: return ['H', 'V'];
  }
}

export function getEndPosition(
  startRow: number,
  startCol: number,
  word: string,
  direction: string
): [number, number] {
  const len: number = word.length - 1;
  switch (direction) {
    case 'H': return [startRow, startCol + len];
    case 'HR': return [startRow, startCol - len];
    case 'V': return [startRow + len, startCol];
    case 'VR': return [startRow - len, startCol];
    case 'D': return [startRow + len, startCol + len];
    case 'DR': return [startRow - len, startCol - len];
    default: return [startRow, startCol + len];
  }
}

export function canPlaceWord(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: string
): boolean {
  let row: number = startRow;
  let col: number = startCol;
  const height: number = grid.length;
  const width: number = grid[0].length;

  for (let i: number = 0; i < word.length; i++) {
    if (row < 0 || row >= height || col < 0 || col >= width) {
      return false;
    }
    if (grid[row][col] !== null && grid[row][col] !== word[i]) {
      return false;
    }
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
): void {
  let row: number = startRow;
  let col: number = startCol;

  for (let i: number = 0; i < word.length; i++) {
    grid[row][col] = word[i];
    switch (direction) {
      case 'H': col++; break;
      case 'HR': col--; break;
      case 'V': row++; break;
      case 'VR': row--; break;
      case 'D': row++; col++; break;
      case 'DR': row--; col--; break;
    }
  }
}

export function calculateDifficulty(
  width: number,
  height: number,
  wordCount: number
): string {
  if (width <= 10 && height <= 10 && wordCount <= 7) return 'easy';
  if (width <= 15 && height <= 15 && wordCount <= 12) return 'medium';
  return 'hard';
}

export function generateFillword(
  width: number,
  height: number,
  words: string[]
): { grid: string[][]; placedWords: PlacedWord[]; error?: string } {
  const upperWords: string[] = words.map((w: string) => w.toUpperCase().trim());
  const sortedWords: string[] = [...upperWords].sort((a: string, b: string) => b.length - a.length);
  const difficulty: string = calculateDifficulty(width, height, sortedWords.length);
  const directions: string[] = getDirections(difficulty);

  const grid: (string | null)[][] = Array.from(
    { length: height },
    () => Array(width).fill(null)
  );

  const placedWords: PlacedWord[] = [];

  for (const word of sortedWords) {
    let placed: boolean = false;
    const shuffledDirections: string[] = [...directions].sort(() => Math.random() - 0.5);

    for (const dir of shuffledDirections) {
      const positions: [number, number][] = [];
      for (let r: number = 0; r < height; r++) {
        for (let c: number = 0; c < width; c++) {
          positions.push([r, c]);
        }
      }
      positions.sort(() => Math.random() - 0.5);

      for (const [r, c] of positions) {
        if (canPlaceWord(grid, word, r, c, dir)) {
          placeWordOnGrid(grid, word, r, c, dir);
          const [endRow, endCol] = getEndPosition(r, c, word, dir);
          placedWords.push({
            word,
            direction: dir,
            startRow: r,
            startCol: c,
            endRow,
            endCol,
          });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      return {
        grid: [],
        placedWords: [],
        error: `Невозможно разместить слово "${word}". Попробуйте изменить слова или увеличить сетку.`,
      };
    }
  }

  const finalGrid: string[][] = grid.map((row: (string | null)[]) =>
    row.map((cell: string | null) => cell || randomChar())
  );

  return { grid: finalGrid, placedWords };
}