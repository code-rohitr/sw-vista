import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';

interface TokenPayload {
  id: string;
  username: string;
  isSystemAdmin: boolean;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      id: decoded.id,
      username: decoded.username,
      isSystemAdmin: decoded.isSystemAdmin
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return {
      id: decoded.id,
      username: decoded.username,
      isSystemAdmin: decoded.isSystemAdmin
    };
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
} 