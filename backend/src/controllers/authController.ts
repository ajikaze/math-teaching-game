import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const { email, username, password } = req.body;

            if (!email || !username || !password) {
                return res.status(400).json({
                    error: 'Email, username, and password are required'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Password must be at least 6 characters long'
                });
            }

            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username }
                    ]
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    error: existingUser.email === email 
                        ? 'Email already registered' 
                        : 'Username already taken'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    characterState: {
                        create: {
                            level: 1,
                            experience: 0,
                            understandingAlgebra: 0,
                            understandingGeometry: 0,
                            understandingFunctions: 0,
                            understandingProbability: 0,
                            mood: 'curious',
                            totalProblems: 0
                        }
                    }
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true
                }
            });

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            logger.info('User registered successfully', { userId: user.id });

            res.status(201).json({
                message: 'User registered successfully',
                user,
                token
            });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({
                error: 'Registration failed'
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required'
                });
            }

            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    password: true
                }
            });

            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            const { password: _, ...userWithoutPassword } = user;

            logger.info('User logged in successfully', { userId: user.id });

            res.json({
                message: 'Login successful',
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed'
            });
        }
    }

    async getProfile(req: Request, res: Response) {
        try {
            const authReq = req as any;
            const userId = authReq.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true,
                    characterState: {
                        select: {
                            level: true,
                            experience: true,
                            understandingAlgebra: true,
                            understandingGeometry: true,
                            understandingFunctions: true,
                            understandingProbability: true,
                            mood: true,
                            totalProblems: true,
                            updatedAt: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json(user);
        } catch (error) {
            logger.error('Get profile error:', error);
            res.status(500).json({
                error: 'Failed to get profile'
            });
        }
    }
}