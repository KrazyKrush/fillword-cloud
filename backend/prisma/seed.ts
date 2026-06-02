import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Начинаем заполнение базы данных...');

  const adminPassword: string = await bcrypt.hash('admin123', 10);
  const userPassword: string = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      passwordHash: userPassword,
      role: 'user',
      isActive: true,
    },
  });

  console.log('Готово! Пользователи созданы:');
  console.log('  admin / admin123');
  console.log('  user  / user123');
}

main()
  .catch((e: Error) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });