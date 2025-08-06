import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { ReportService } from '../services/reportService';
import { ComparisonService } from '../services/comparisonService';
import { logger } from '../utils/logger';

export class AnalyticsController {
  private analytics: AnalyticsService;
  private reports: ReportService;
  private comparison: ComparisonService;

  constructor() {
    this.analytics = new AnalyticsService();
    this.reports = new ReportService();
    this.comparison = new ComparisonService();
  }

  // 詳細統計の取得
  getDetailedStats = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await this.analytics.getDetailedStats(userId, days);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get detailed stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get detailed stats'
      });
    }
  };

  // 学習セッション開始
  startLearningSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { topic } = req.body;
      
      const sessionId = await this.analytics.startLearningSession(userId, topic);
      
      res.json({
        success: true,
        data: { sessionId }
      });
    } catch (error) {
      logger.error('Start learning session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start learning session'
      });
    }
  };

  // 学習セッション終了
  endLearningSession = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      await this.analytics.endLearningSession(sessionId);
      
      res.json({
        success: true,
        message: 'Learning session ended successfully'
      });
    } catch (error) {
      logger.error('End learning session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end learning session'
      });
    }
  };

  // 学習活動記録
  recordActivity = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { sessionId, ...activityData } = req.body;
      
      await this.analytics.recordLearningActivity(sessionId, userId, activityData);
      
      res.json({
        success: true,
        message: 'Activity recorded successfully'
      });
    } catch (error) {
      logger.error('Record activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record activity'
      });
    }
  };

  // 日次レポート
  getDailyReport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      const report = await this.reports.generateDailyReport(userId, date);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Get daily report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate daily report'
      });
    }
  };

  // 週次レポート
  getWeeklyReport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const report = await this.reports.generateWeeklyReport(userId);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Get weekly report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate weekly report'
      });
    }
  };

  // 月次レポート
  getMonthlyReport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const report = await this.reports.generateMonthlyReport(userId);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Get monthly report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate monthly report'
      });
    }
  };

  // カスタムレポート
  getCustomReport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { startDate, endDate } = req.body;
      
      const report = await this.reports.generateCustomReport(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Get custom report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate custom report'
      });
    }
  };

  // ピア比較
  getPeerComparison = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const comparison = await this.comparison.getPeerComparison(userId, days);
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      logger.error('Get peer comparison error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get peer comparison'
      });
    }
  };

  // 進捗比較
  getProgressComparison = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const comparison = await this.comparison.getProgressComparison(userId, days);
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      logger.error('Get progress comparison error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress comparison'
      });
    }
  };

  // データ可視化 - 進捗チャート
  getProgressChart = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await this.analytics.getDetailedStats(userId, days);
      
      const chartData = {
        type: 'line',
        title: '学習進捗グラフ',
        data: {
          labels: stats.dailyProgress.map(d => d.date),
          datasets: [
            {
              label: '正答率 (%)',
              data: stats.dailyProgress.map(d => Math.round(d.accuracy * 100)),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              yAxisID: 'accuracy'
            },
            {
              label: '学習時間 (分)',
              data: stats.dailyProgress.map(d => d.studyTime),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              yAxisID: 'time'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            accuracy: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 0,
              max: 100,
              title: { display: true, text: '正答率 (%)' }
            },
            time: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              title: { display: true, text: '学習時間 (分)' },
              grid: { drawOnChartArea: false }
            }
          }
        }
      };

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get progress chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress chart'
      });
    }
  };

  // データ可視化 - トピック別内訳
  getTopicBreakdown = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await this.analytics.getDetailedStats(userId, days);
      
      const topicNames = {
        algebra: '代数',
        geometry: '幾何',
        functions: '関数',
        probability: '確率'
      };

      const chartData = {
        type: 'doughnut',
        title: 'トピック別学習時間',
        data: {
          labels: Object.keys(stats.topicBreakdown).map(topic => 
            topicNames[topic as keyof typeof topicNames] || topic
          ),
          datasets: [{
            data: Object.values(stats.topicBreakdown).map((topic: any) => topic.studyTime),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' as const },
            title: { display: true, text: 'トピック別学習時間分布' }
          }
        }
      };

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get topic breakdown error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get topic breakdown'
      });
    }
  };

  // データ可視化 - 時間分布
  getTimeDistribution = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await this.analytics.getDetailedStats(userId, days);
      
      const chartData = {
        type: 'bar',
        title: '日別学習時間',
        data: {
          labels: stats.dailyProgress.map(d => 
            new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
          ),
          datasets: [{
            label: '学習時間 (分)',
            data: stats.dailyProgress.map(d => d.studyTime),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: '分' }
            }
          }
        }
      };

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get time distribution error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get time distribution'
      });
    }
  };

  // データ可視化 - パフォーマンストレンド
  getPerformanceTrends = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await this.analytics.getDetailedStats(userId, days);
      
      // 7日間の移動平均を計算
      const calculateMovingAverage = (data: number[], window: number = 7) => {
        const result = [];
        for (let i = 0; i < data.length; i++) {
          const start = Math.max(0, i - window + 1);
          const slice = data.slice(start, i + 1);
          const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
          result.push(Math.round(average * 100) / 100);
        }
        return result;
      };

      const accuracyData = stats.dailyProgress.map(d => d.accuracy * 100);
      const scoreData = stats.dailyProgress.map(d => d.score);
      
      const chartData = {
        type: 'line',
        title: 'パフォーマンストレンド（7日移動平均）',
        data: {
          labels: stats.dailyProgress.map(d => 
            new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
          ),
          datasets: [
            {
              label: '正答率トレンド (%)',
              data: calculateMovingAverage(accuracyData),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'スコアトレンド',
              data: calculateMovingAverage(scoreData),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'score'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 0,
              max: 100,
              title: { display: true, text: '正答率 (%)' }
            },
            score: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              title: { display: true, text: 'スコア' },
              grid: { drawOnChartArea: false }
            }
          }
        }
      };

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get performance trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance trends'
      });
    }
  };

  // データ可視化 - 比較チャート
  getComparisonCharts = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const [peerComparison, progressComparison] = await Promise.all([
        this.comparison.getPeerComparison(userId, days),
        this.comparison.getProgressComparison(userId, days)
      ]);

      const charts = {
        peerComparison: {
          type: 'radar',
          title: 'ピア比較',
          data: {
            labels: ['学習時間', '正答率', '連続学習', 'レベル', '問題数/日'],
            datasets: [
              {
                label: 'あなた',
                data: [
                  (peerComparison.userStats.studyTime / peerComparison.peerAverages.studyTime) * 100,
                  peerComparison.userStats.accuracy * 100,
                  (peerComparison.userStats.streak / Math.max(peerComparison.peerAverages.streak, 1)) * 100,
                  (peerComparison.userStats.level / peerComparison.peerAverages.level) * 100,
                  (peerComparison.userStats.problemsPerDay / peerComparison.peerAverages.problemsPerDay) * 100
                ],
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)'
              },
              {
                label: '平均',
                data: [100, 100, 100, 100, 100],
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)'
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 200,
                ticks: { stepSize: 50 }
              }
            }
          }
        },
        progressComparison: {
          type: 'bar',
          title: '期間比較',
          data: {
            labels: ['学習時間', '正答率', '解いた問題数'],
            datasets: [
              {
                label: '今期',
                data: [
                  progressComparison.currentPeriod.studyTime,
                  progressComparison.currentPeriod.accuracy * 100,
                  progressComparison.currentPeriod.problemsSolved
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgb(54, 162, 235)'
              },
              {
                label: '前期',
                data: [
                  progressComparison.previousPeriod.studyTime,
                  progressComparison.previousPeriod.accuracy * 100,
                  progressComparison.previousPeriod.problemsSolved
                ],
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgb(255, 99, 132)'
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true }
            }
          }
        }
      };

      res.json({
        success: true,
        data: charts
      });
    } catch (error) {
      logger.error('Get comparison charts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get comparison charts'
      });
    }
  };
}