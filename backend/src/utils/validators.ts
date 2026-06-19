import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const createFillwordSchema = z.object({
  title: z.string().min(1).max(100),
  topic: z.string().min(1).max(100),
  width: z.number().int().min(5).max(30),
  height: z.number().int().min(5).max(30),
  words: z.array(z.string()).min(5),
  isAiGenerated: z.boolean().optional().default(false),
});

export const checkWordSchema = z.object({
  word: z.string().min(1, 'Введите слово'),
  cells: z.array(
    z.object({
      row: z.number().int().min(0),
      col: z.number().int().min(0),
    })
  ).min(1, 'Выделите хотя бы одну ячейку'),
});

export const rejectSchema = z.object({
  rejectionReason: z.string().min(1),
});

export const aiGenerateSchema = z.object({
  topic: z.string().min(1),
  count: z.number().int().min(5).max(20).optional().default(12),
});