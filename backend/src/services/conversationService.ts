import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ConversationMessage {
    role: string;
    content: string;
    topic?: string;
}

export class ConversationService {
    async saveMessage(userId: string, message: ConversationMessage) {
        try {
            return await prisma.conversation.create({
                data: {
                    userId,
                    role: message.role,
                    content: message.content,
                    topic: message.topic,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Failed to save conversation message:', error);
            throw new Error('Failed to save conversation message');
        }
    }

    async getConversationHistory(userId: string, limit: number = 50) {
        try {
            const conversations = await prisma.conversation.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: limit
            });

            // 新しい順から古い順に並び替え
            return conversations.reverse();
        } catch (error) {
            logger.error('Failed to get conversation history:', error);
            throw new Error('Failed to get conversation history');
        }
    }

    async getRecentConversations(userId: string, hours: number = 24) {
        try {
            const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

            return await prisma.conversation.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: cutoffTime
                    }
                },
                orderBy: { timestamp: 'asc' }
            });
        } catch (error) {
            logger.error('Failed to get recent conversations:', error);
            throw new Error('Failed to get recent conversations');
        }
    }

    async deleteOldConversations(userId: string, daysToKeep: number = 30) {
        try {
            const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

            const result = await prisma.conversation.deleteMany({
                where: {
                    userId,
                    timestamp: {
                        lt: cutoffTime
                    }
                }
            });

            logger.info(`Deleted ${result.count} old conversation messages for user ${userId}`);
            return result;
        } catch (error) {
            logger.error('Failed to delete old conversations:', error);
            throw new Error('Failed to delete old conversations');
        }
    }

    async getConversationStats(userId: string) {
        try {
            const totalMessages = await prisma.conversation.count({
                where: { userId }
            });

            const topicStats = await prisma.conversation.groupBy({
                by: ['topic'],
                where: { 
                    userId,
                    topic: {
                        not: null
                    }
                },
                _count: {
                    topic: true
                }
            });

            const recentActivity = await prisma.conversation.findFirst({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                select: { timestamp: true }
            });

            return {
                totalMessages,
                topicStats: topicStats.map(stat => ({
                    topic: stat.topic,
                    count: stat._count.topic
                })),
                lastActivity: recentActivity?.timestamp
            };
        } catch (error) {
            logger.error('Failed to get conversation stats:', error);
            throw new Error('Failed to get conversation stats');
        }
    }
}