import { Response } from 'express';
import { AdaptiveLearningService } from '../services/adaptiveLearningService';
import { PersonalizationService } from '../services/personalizationService';
import { EnhancedAIService } from '../services/enhancedAIService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

const adaptiveLearning = new AdaptiveLearningService();
const personalization = new PersonalizationService();
const enhancedAI = new EnhancedAIService();

export class AdaptiveLearningController {
  // 学習メトリクスの取得
  async getLearningMetrics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const metrics = await adaptiveLearning.calculateLearningMetrics(userId);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Get learning metrics error:', error);
      res.status(500).json({
        error: 'Failed to get learning metrics'
      });
    }
  }

  // 適応的推薦の取得
  async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const recommendations = await adaptiveLearning.generateRecommendations(userId);
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Get recommendations error:', error);
      res.status(500).json({
        error: 'Failed to get recommendations'
      });
    }
  }

  // 学習パスの生成
  async getLearningPath(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const learningPath = await adaptiveLearning.generateLearningPath(userId);
      
      res.json({
        success: true,
        data: learningPath
      });
    } catch (error) {
      logger.error('Get learning path error:', error);
      res.status(500).json({
        error: 'Failed to generate learning path'
      });
    }
  }

  // ユーザー個性プロファイルの取得
  async getPersonalityProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const profile = await personalization.analyzeUserPersonality(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Get personality profile error:', error);
      res.status(500).json({
        error: 'Failed to analyze personality profile'
      });
    }
  }

  // パーソナライズされたコンテンツの生成
  async getPersonalizedContent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { topic, requestType, previousMessage, currentDifficulty } = req.body;

      if (!topic || !requestType) {
        return res.status(400).json({
          error: 'Topic and requestType are required'
        });
      }

      const content = await personalization.generatePersonalizedContent(
        userId,
        topic,
        requestType,
        {
          previousMessage,
          currentDifficulty
        }
      );
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Get personalized content error:', error);
      res.status(500).json({
        error: 'Failed to generate personalized content'
      });
    }
  }

  // 強化されたAIチャット
  async enhancedChat(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const requestData = {
        userId,
        ...req.body
      };

      // リクエストデータの検証
      if (!requestData.currentTopic || !requestData.requestType) {
        return res.status(400).json({
          error: 'currentTopic and requestType are required'
        });
      }

      const aiResponse = await enhancedAI.processRequest(requestData);
      
      res.json({
        success: true,
        ...aiResponse
      });
    } catch (error) {
      logger.error('Enhanced chat error:', error);
      res.status(500).json({
        error: 'Failed to process enhanced chat request'
      });
    }
  }

  // キャラクター行動のパーソナライゼーション
  async personalizeCharacterBehavior(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { userMessage, topic, sessionLength, recentPerformance } = req.body;

      if (!userMessage || !topic) {
        return res.status(400).json({
          error: 'userMessage and topic are required'
        });
      }

      const behavior = await personalization.personalizeCharacterBehavior(
        userId,
        userMessage,
        {
          topic,
          sessionLength: sessionLength || 0,
          recentPerformance: recentPerformance || 0.5
        }
      );
      
      res.json({
        success: true,
        data: behavior
      });
    } catch (error) {
      logger.error('Personalize character behavior error:', error);
      res.status(500).json({
        error: 'Failed to personalize character behavior'
      });
    }
  }

  // 学習進捗の詳細分析
  async getDetailedAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const [metrics, recommendations, learningPath, personality] = await Promise.all([
        adaptiveLearning.calculateLearningMetrics(userId),
        adaptiveLearning.generateRecommendations(userId),
        adaptiveLearning.generateLearningPath(userId),
        personalization.analyzeUserPersonality(userId)
      ]);

      const analysis = {
        metrics,
        recommendations,
        learningPath,
        personality,
        summary: {
          overallProgress: this.calculateOverallProgress(metrics),
          nextSteps: recommendations.slice(0, 2),
          strengths: metrics.masteredTopics,
          areasForImprovement: metrics.strugglingTopics,
          learningStyle: personality.learningStyle,
          motivationLevel: this.assessMotivationLevel(metrics, personality)
        }
      };
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Get detailed analysis error:', error);
      res.status(500).json({
        error: 'Failed to get detailed analysis'
      });
    }
  }

  // プライベートヘルパーメソッド
  private calculateOverallProgress(metrics: any): number {
    const totalUnderstanding = Object.values(metrics.topicProficiency)
      .reduce((sum: number, value: any) => sum + value, 0);
    return Math.round(totalUnderstanding / 4);
  }

  private assessMotivationLevel(metrics: any, personality: any): 'low' | 'medium' | 'high' {
    const factors = [
      metrics.learningVelocity > 3,
      personality.characterRelationship.trustLevel > 50,
      metrics.totalProblems > 10,
      personality.motivationFactors.length > 1
    ];

    const score = factors.filter(Boolean).length;
    
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
}