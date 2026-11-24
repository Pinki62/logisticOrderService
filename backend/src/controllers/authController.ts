import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { UserAccess, UserRole } from '../models/user.js';

const allowedRoles: UserRole[] = ['ADMIN', 'USER'];
const allowedAccess: UserAccess[] = ['VIEW', 'CREATE'];

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, role, access } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    password.length < 6 ||
    !allowedRoles.includes(role)
  ) {
    res.status(400).json({
      message: 'Valid email, password (minimum 6 characters), and role are required.',
    });
    return;
  }

  if (role === 'ADMIN') {
    res.status(403).json({
      message: 'ADMIN accounts must be provisioned by an operator.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ message: 'A valid email address is required.' });
    return;
  }

  let userAccess: UserAccess | null = null;

  if (role === 'USER') {
    userAccess = access ?? 'VIEW';

    if (userAccess === null || (!allowedAccess.includes(userAccess))) {
      res.status(400).json({ message: 'Access must be VIEW or CREATE.' });
      return;
    }
  } else if (access !== undefined && access !== null) {
    res.status(400).json({ message: 'ADMIN users cannot have user access settings.' });
    return;
  }

  try {
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ message: 'Email is already registered.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      password_hash,
      role,
      access: userAccess,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        access: user.access,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Could not register user.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({ message: 'Authentication is not configured.' });
      return;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        access: user.access,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        access: user.access,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Could not log in.' });
  }
}