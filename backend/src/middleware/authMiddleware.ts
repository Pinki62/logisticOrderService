import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserAccess, UserRole } from '../models/user';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication token is required.' });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: 'Authentication is not configured.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'string' || !decoded.sub) {
      res.status(401).json({ message: 'Invalid authentication token.' });
      return;
    }

    const payload = decoded as JwtPayload;
    const role = payload.role;
    const access = payload.access;

    if (
      typeof role !== 'string' ||
      (role !== 'ADMIN' && role !== 'USER') ||
      typeof payload.sub !== 'string' && typeof payload.sub !== 'number'
    ) {
      res.status(401).json({ message: 'Invalid authentication token.' });
      return;
    }

    const id = Number(payload.sub);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(401).json({ message: 'Invalid authentication token.' });
      return;
    }

    let userAccess: UserAccess | null = null;

    if (role === 'USER') {
      if (access !== 'VIEW' && access !== 'CREATE') {
        res.status(401).json({ message: 'Invalid authentication token.' });
        return;
      }
      userAccess = access;
    } else if (access !== null) {
      res.status(401).json({ message: 'Invalid authentication token.' });
      return;
    }

    req.user = {
      id,
      role: role as UserRole,
      access: userAccess,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to do this.' });
      return;
    }

    next();
  };
}

export function requireCreateAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const canCreate =
    req.user?.role === 'ADMIN' ||
    (req.user?.role === 'USER' && req.user.access === 'CREATE');

  if (!canCreate) {
    res.status(403).json({ message: 'Your account does not have create access.' });
    return;
  }

  next();
}