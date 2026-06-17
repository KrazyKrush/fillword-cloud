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

  // Проверка временной блокировки за попытки
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    throw new Error(`Вход временно заблокирован. Попробуйте через ${minutes} мин.`);
  }

  // Проверка бана
  if (!user.isActive) {
    const reason = user.blockReason || 'Нарушение правил';
    throw new Error(`Аккаунт заблокирован. Причина: ${reason}`);
  }

  const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);
  
  if (!isPasswordValid) {
    // Увеличиваем счётчик попыток
    const attempts = user.loginAttempts + 1;
    const updateData: any = { loginAttempts: attempts };

    // После 5 неудачных попыток — блокировка на 15 минут
    if (attempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.loginAttempts = 0; // сбрасываем счётчик
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    if (attempts >= 5) {
      throw new Error('Слишком много попыток. Вход заблокирован на 15 минут.');
    }
    
    throw new Error(`Неверный пароль. Осталось попыток: ${5 - attempts}`);
  }

  // Успешный вход — сбрасываем счётчик
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
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

export async function getUserProfile(userId: number): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { createdFillwords: true, solveResults: true, achievements: true } },
    },
  });

  if (!user) throw new Error('Пользователь не найден');

  // Проверка запрета публикации
  let muteMessage: string | null = null;
  if (user.muteUntil && new Date(user.muteUntil) > new Date()) {
    const until = new Date(user.muteUntil).toLocaleString('ru-RU');
    muteMessage = `Запрет публикации до ${until}. Причина: ${user.muteReason || 'Нарушение правил'}`;
  }

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
    muteUntil: user.muteUntil,
    muteReason: user.muteReason,
    muteMessage,
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
        muteUntil: true,
        muteReason: true,
        lockedUntil: true,
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
      muteUntil: u.muteUntil,
      muteReason: u.muteReason,
      lockedUntil: u.lockedUntil,
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

export async function toggleUserBlock(
  userId: number,
  isActive: boolean,
  reason?: string,
  blockedById?: number
): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Пользователь не найден');

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive,
      blockReason: isActive ? null : (reason || null),
      blockedAt: isActive ? null : new Date(),
      blockedById: isActive ? null : (blockedById || null),
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  return {
    id: userId,
    username: user.username,
    isActive,
    message: isActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
  };
}

export async function muteUser(
  userId: number,
  minutes: number,
  reason: string,
  adminId: number
): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Пользователь не найден');

  const muteUntil = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      muteUntil,
      muteReason: reason,
    },
  });

  return {
    id: userId,
    username: user.username,
    muteUntil,
    muteReason: reason,
    message: `Пользователю запрещена публикация на ${minutes} мин.`,
  };
}

export async function unmuteUser(userId: number): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Пользователь не найден');

  await prisma.user.update({
    where: { id: userId },
    data: {
      muteUntil: null,
      muteReason: null,
    },
  });

  return {
    id: userId,
    username: user.username,
    message: 'Запрет публикации снят',
  };
}