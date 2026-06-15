-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "Fillword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "moderatorId" INTEGER,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "deletedReason" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "totalWordsCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" DATETIME,
    "publishedAt" DATETIME,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Fillword_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fillword_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GridCell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fillwordId" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    CONSTRAINT "GridCell_fillwordId_fkey" FOREIGN KEY ("fillwordId") REFERENCES "Fillword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fillwordId" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "startRow" INTEGER NOT NULL,
    "startCol" INTEGER NOT NULL,
    "endRow" INTEGER NOT NULL,
    "endCol" INTEGER NOT NULL,
    CONSTRAINT "Word_fillwordId_fkey" FOREIGN KEY ("fillwordId") REFERENCES "Fillword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordPath" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wordId" INTEGER NOT NULL,
    "step" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    CONSTRAINT "WordPath_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolveResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "fillwordId" INTEGER NOT NULL,
    "timeSeconds" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "wordsFoundCount" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "SolveResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolveResult_fillwordId_fkey" FOREIGN KEY ("fillwordId") REFERENCES "Fillword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StopList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "addedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StopList_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "GridCell_fillwordId_row_col_key" ON "GridCell"("fillwordId", "row", "col");

-- CreateIndex
CREATE UNIQUE INDEX "WordPath_wordId_step_key" ON "WordPath"("wordId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "SolveResult_userId_fillwordId_key" ON "SolveResult"("userId", "fillwordId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_code_key" ON "Achievement"("userId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StopList_word_key" ON "StopList"("word");
