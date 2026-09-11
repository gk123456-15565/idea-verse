import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ideverse-secure-jwt-secret-key-32148729104';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
}

export function generateToken(payload: { id: string; username: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
