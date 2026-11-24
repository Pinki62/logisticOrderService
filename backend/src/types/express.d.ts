import { UserAccess, UserRole } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: UserRole;
        access: UserAccess | null;
      };
    }
  }
}

export {};