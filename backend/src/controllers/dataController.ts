import { Request, Response } from 'express';
import { CharacterService } from '../services/characterService';
import { ConversationService } from '../services/conversationService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

const characterService = new CharacterService();
const conversationService = new ConversationService();

export class DataController {
    async getCharacterState(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const characterState = await characterService.getCharacterState(userId);

            res.json({
                success: true,
                data: characterState
            });
        } catch (error) {
            logger.error('Get character state error:', error);
            res.status(500).json({
                error: 'Failed to get character state'
            });
        }
    }

    async updateCharacterState(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const updateData = req.body;

            const updatedState = await characterService.updateCharacterState(userId, updateData);

            res.json({
                success: true,
                data: updatedState
            });
        } catch (error) {
            logger.error('Update character state error:', error);
            res.status(500).json({
                error: 'Failed to update character state'
            });
        }
    }

    async addExperience(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { experience, topic } = req.body;

            if (typeof experience !== 'number' || experience < 0) {
                return res.status(400).json({
                    error: 'Invalid experience value'
                });
            }

            const updatedState = await characterService.addExperience(userId, experience, topic);

            res.json({
                success: true,
                data: updatedState
            });
        } catch (error) {
            logger.error('Add experience error:', error);
            res.status(500).json({
                error: 'Failed to add experience'
            });
        }
    }

    async getConversationHistory(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 50;

            const history = await conversationService.getConversationHistory(userId, limit);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            logger.error('Get conversation history error:', error);
            res.status(500).json({
                error: 'Failed to get conversation history'
            });
        }
    }

    async saveMessage(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { role, content, topic } = req.body;

            if (!role || !content) {
                return res.status(400).json({
                    error: 'Role and content are required'
                });
            }

            const savedMessage = await conversationService.saveMessage(userId, {
                role,
                content,
                topic
            });

            res.json({
                success: true,
                data: savedMessage
            });
        } catch (error) {
            logger.error('Save message error:', error);
            res.status(500).json({
                error: 'Failed to save message'
            });
        }
    }

    async getStats(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;

            const [characterState, conversationStats] = await Promise.all([
                characterService.getCharacterState(userId),
                conversationService.getConversationStats(userId)
            ]);

            res.json({
                success: true,
                data: {
                    character: characterState,
                    conversations: conversationStats
                }
            });
        } catch (error) {
            logger.error('Get stats error:', error);
            res.status(500).json({
                error: 'Failed to get stats'
            });
        }
    }

    async updateMood(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { mood } = req.body;

            if (!mood) {
                return res.status(400).json({
                    error: 'Mood is required'
                });
            }

            const updatedState = await characterService.updateMood(userId, mood);

            res.json({
                success: true,
                data: updatedState
            });
        } catch (error) {
            logger.error('Update mood error:', error);
            res.status(500).json({
                error: 'Failed to update mood'
            });
        }
    }
}