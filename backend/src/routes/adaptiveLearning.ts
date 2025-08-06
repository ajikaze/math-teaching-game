import express from 'express';
import { AdaptiveLearningController } from '../controllers/adaptiveLearningController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new AdaptiveLearningController();

// すべてのルートに認証を適用
router.use(authenticateToken);

// 学習メトリクス関連
router.get('/metrics', controller.getLearningMetrics);
router.get('/recommendations', controller.getRecommendations);
router.get('/learning-path', controller.getLearningPath);

// パーソナライゼーション関連
router.get('/personality-profile', controller.getPersonalityProfile);
router.post('/personalized-content', controller.getPersonalizedContent);
router.post('/character-behavior', controller.personalizeCharacterBehavior);

// 強化されたAI機能
router.post('/enhanced-chat', controller.enhancedChat);

// 総合分析
router.get('/detailed-analysis', controller.getDetailedAnalysis);

export default router;