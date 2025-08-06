import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CharacterUpdateData {
    level?: number;
    experience?: number;
    understandingAlgebra?: number;
    understandingGeometry?: number;
    understandingFunctions?: number;
    understandingProbability?: number;
    mood?: string;
    totalProblems?: number;
}

export class CharacterService {
    async getCharacterState(userId: string) {
        try {
            const characterState = await prisma.characterState.findUnique({
                where: { userId }
            });

            if (!characterState) {
                // キャラクター状態が存在しない場合は新規作成
                return await this.createCharacterState(userId);
            }

            return characterState;
        } catch (error) {
            logger.error('Failed to get character state:', error);
            throw new Error('Failed to get character state');
        }
    }

    async createCharacterState(userId: string) {
        try {
            return await prisma.characterState.create({
                data: {
                    userId,
                    level: 1,
                    experience: 0,
                    understandingAlgebra: 0,
                    understandingGeometry: 0,
                    understandingFunctions: 0,
                    understandingProbability: 0,
                    mood: 'curious',
                    totalProblems: 0
                }
            });
        } catch (error) {
            logger.error('Failed to create character state:', error);
            throw new Error('Failed to create character state');
        }
    }

    async updateCharacterState(userId: string, updateData: CharacterUpdateData) {
        try {
            return await prisma.characterState.update({
                where: { userId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Failed to update character state:', error);
            throw new Error('Failed to update character state');
        }
    }

    async addExperience(userId: string, expGain: number, topic?: string) {
        try {
            const currentState = await this.getCharacterState(userId);
            
            const newExperience = currentState.experience + expGain;
            const newLevel = Math.floor(newExperience / 100) + 1; // 100 exp per level

            const updateData: CharacterUpdateData = {
                experience: newExperience,
                level: Math.min(newLevel, currentState.level + 1), // 一度に1レベルずつ
                totalProblems: currentState.totalProblems + 1
            };

            // トピックに応じた理解度を更新
            if (topic) {
                const understandingGain = Math.min(5, expGain); // 最大5ポイントずつ
                switch (topic) {
                    case 'algebra':
                        updateData.understandingAlgebra = Math.min(100, 
                            currentState.understandingAlgebra + understandingGain);
                        break;
                    case 'geometry':
                        updateData.understandingGeometry = Math.min(100, 
                            currentState.understandingGeometry + understandingGain);
                        break;
                    case 'functions':
                        updateData.understandingFunctions = Math.min(100, 
                            currentState.understandingFunctions + understandingGain);
                        break;
                    case 'probability':
                        updateData.understandingProbability = Math.min(100, 
                            currentState.understandingProbability + understandingGain);
                        break;
                }
            }

            return await this.updateCharacterState(userId, updateData);
        } catch (error) {
            logger.error('Failed to add experience:', error);
            throw new Error('Failed to add experience');
        }
    }

    async updateMood(userId: string, mood: string) {
        try {
            const validMoods = ['curious', 'happy', 'confused', 'excited'];
            if (!validMoods.includes(mood)) {
                throw new Error('Invalid mood');
            }

            return await this.updateCharacterState(userId, { mood });
        } catch (error) {
            logger.error('Failed to update mood:', error);
            throw new Error('Failed to update mood');
        }
    }
}