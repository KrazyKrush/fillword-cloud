import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader: string | undefined = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  const token: string = authHeader.split(' ')[1];

  try {
    const decoded: JwtPayload = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный или истекший токен' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader: string | undefined = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token: string = authHeader.split(' ')[1];
    try {
      const decoded: JwtPayload = verifyToken(token);
      req.user = decoded;
    } catch (error) {
    }
  }

  next();
}