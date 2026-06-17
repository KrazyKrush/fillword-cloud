import request from 'supertest';
import express from 'express';
import fillwordRoutes from '../routes/fillwords';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/fillwords', fillwordRoutes);

describe('Fillwords API', () => {
  test('GET /api/fillwords — получение каталога', async () => {
    const res = await request(app).get('/api/fillwords');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('content');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('totalElements');
    expect(Array.isArray(res.body.content)).toBe(true);
  });

  test('GET /api/fillwords?difficulty=easy — фильтрация по сложности', async () => {
    const res = await request(app)
      .get('/api/fillwords')
      .query({ difficulty: 'easy' });

    expect(res.status).toBe(200);
    res.body.content.forEach((fw: any) => {
      expect(fw.difficulty).toBe('easy');
    });
  });

  test('GET /api/fillwords?search=тест — поиск по названию', async () => {
    const res = await request(app)
      .get('/api/fillwords')
      .query({ search: 'несуществующий' });

    expect(res.status).toBe(200);
  });

  test('GET /api/fillwords/999 — несуществующий филворд', async () => {
    const res = await request(app).get('/api/fillwords/999');

    expect(res.status).toBe(404);
  });
});