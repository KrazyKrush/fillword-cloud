import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

const prisma: PrismaClient = new PrismaClient();

export async function registerUser(username: string, password: string): Promise<any> {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error('Пользователь с таким именем уже существует');
  }

  const passwordHash: string = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash, role: 'user', isActive: true },
  });

  const token: string = generateToken({ userId: user.id, username: user.username, role: user.role });

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 86400,
  };
}

export async function loginUser(username: string, password: string): Promise<any> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('Неверное имя пользователя или пароль');
  if (!user.isActive) throw new Error('Аккаунт заблокирован. Обратитесь к администратору');

  const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw new Error('Неверное имя пользователя или пароль');

  const token: string = generateToken({ userId: user.id, username: user.username, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 86400,
  };
}

export async function getUserProfile(userId: number): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { createdFillwords: true, solveResults: true, achievements: true } },
    },
  });

  if (!user) throw new Error('Пользователь не найден');

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt,
    totalCreated: user._count.createdFillwords,
    totalSolved: user._count.solveResults,
    totalAchievements: user._count.achievements,
  };
}

export async function getAllUsers(page: number = 1, size: number = 20): Promise<any> {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        registeredAt: true,
        lastLoginAt: true,
        _count: { select: { createdFillwords: true, solveResults: true } },
      },
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.user.count(),
  ]);

  return {
    content: users.map((u: any) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      registeredAt: u.registeredAt,
      lastLoginAt: u.lastLoginAt,
      totalCreated: u._count.createdFillwords,
      totalSolved: u._count.solveResults,
    })),
    totalPages: Math.ceil(total / size),
    totalElements: total,
    currentPage: page,
  };
}

export async function toggleUserBlock(userId: number, isActive: boolean): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Пользователь не найден');

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  return {
    id: userId,
    username: user.username,
    isActive,
    message: isActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
  };
}