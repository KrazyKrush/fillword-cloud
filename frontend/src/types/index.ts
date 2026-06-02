export interface User {
  id: number
  username: string
  role: string
}

export interface FillwordCard {
  id: number
  title: string
  topic: string
  difficulty: string
  creatorUsername: string
  totalWordsCount: number
  viewsCount: number
  createdAt: string
}

export interface FillwordWord {
  id: number
  word: string
  direction: string
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface FillwordDetail {
  id: number
  title: string
  topic: string
  difficulty: string
  status: string
  width: number
  height: number
  grid: string[][]
  words: FillwordWord[]
  creatorUsername: string
  rejectionReason: string | null
  totalWordsCount: number
}

export interface SolveSession {
  resultId: number
  fillwordId: number
  startedAt: string
  totalWordsCount: number
  isCompleted: boolean
}

export interface CheckWordResponse {
  isCorrect: boolean
  wordFound?: string
  wordsFoundCount: number
  totalWordsCount: number
  isCompleted: boolean
  timeSeconds: number
  errorsCount: number
}

export interface LeaderboardEntry {
  rank: number
  username: string
  timeSeconds: number
  errorsCount: number
}

export interface LeaderboardData {
  fillwordId: number
  fillwordTitle: string
  difficulty: string
  leaderboard: LeaderboardEntry[]
}

export interface AiGenerateResponse {
  topic: string
  words: string[]
  generatedAt: string
  isFallback: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  currentPage: number
}

export interface ModerationQueueItem {
  id: number
  title: string
  topic: string
  difficulty: string
  creatorUsername: string
  totalWordsCount: number
  createdAt: string
}

export interface ModerationQueueResponse {
  content: ModerationQueueItem[]
  totalInQueue: number
  totalPages: number
  currentPage: number
}