import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new AnalyticsController();

// すべてのルートに認証を適用
router.use(authenticateToken);

// 学習統計関連
router.get('/detailed-stats', controller.getDetailedStats);
router.post('/session/start', controller.startLearningSession);
router.post('/session/:sessionId/end', controller.endLearningSession);
router.post('/activity/record', controller.recordActivity);

// レポート生成
router.get('/reports/daily', controller.getDailyReport);
router.get('/reports/weekly', controller.getWeeklyReport);
router.get('/reports/monthly', controller.getMonthlyReport);
router.post('/reports/custom', controller.getCustomReport);

// 比較分析
router.get('/comparison/peer', controller.getPeerComparison);
router.get('/comparison/progress', controller.getProgressComparison);

// データ可視化
router.get('/visualizations/progress-chart', controller.getProgressChart);
router.get('/visualizations/topic-breakdown', controller.getTopicBreakdown);
router.get('/visualizations/time-distribution', controller.getTimeDistribution);
router.get('/visualizations/performance-trends', controller.getPerformanceTrends);
router.get('/visualizations/comparison-charts', controller.getComparisonCharts);

export default router;