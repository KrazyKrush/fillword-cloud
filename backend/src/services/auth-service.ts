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
    data: { username, passwordHash, role: 'user' },
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
  if (!user.isActive) throw new Error('Аккаунт заблокирован');

  const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw new Error('Неверное имя пользователя или пароль');

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