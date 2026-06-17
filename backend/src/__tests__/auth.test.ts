import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  let token: string;

  test('POST /api/auth/register — регистрация нового пользователя', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'test123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('role', 'user');
  });

  test('POST /api/auth/register — повторная регистрация (ошибка)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'test123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/login — успешный вход', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'test123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    token = res.body.accessToken;
  });

  test('POST /api/auth/login — неверный пароль', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/profile — получение профиля', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'testuser');
  });

  test('POST /api/auth/logout — выход из системы', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /api/auth/profile — без токена (ошибка)', async () => {
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.status).toBe(401);
  });
});