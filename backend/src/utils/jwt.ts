import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-change-me-1234567890';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(
    payload as object,
    JWT_SECRET as jwt.Secret,
    { expiresIn: '24h' as const }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
}