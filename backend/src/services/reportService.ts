import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsService } from './analyticsService';

const prisma = new PrismaClient();

export interface LearningReport {
  reportId: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    headline: string;
    keyInsights: string[];
    overallRating: 'excellent' | 'good' | 'average' | 'needs_improvement';
  };
  metrics: {
    studyTime: {
      total: number;
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    performance: {
      accuracy: number;
      improvement: number;
      strongestTopic: string;
      weakestTopic: string;
    };
    engagement: {
      activeDays: number;
      streak: number;
      consistency: number; // 0-1
    };
  };
  achievements: Array<{
    title: string;
    description: string;
    category: string;
    earnedAt: Date;
  }>;
  goals: Array<{
    title: string;
    description: string;
    targetDate: Date;
    progress: number; // 0-1
    isCompleted: boolean;
  }>;
  recommendations: Array<{
    type: 'study_plan' | 'topic_focus' | 'schedule' | 'motivation';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }>;
  charts: {
    progressChart: any;
    topicBreakdown: any;
    timeDistribution: any;
  };
}

export class ReportService {
  private analytics: AnalyticsService;

  constructor() {
    this.analytics = new AnalyticsService();
  }

  // 日次レポートの生成
  async generateDailyReport(userId: string, date?: Date): Promise<LearningReport> {
    try {
      const targetDate = date || new Date();
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      const detailedStats = await this.analytics.getDetailedStats(userId, 1);
      
      return {
        reportId: `daily_${userId}_${startDate.toISOString().split('T')[0]}`,
        userId,
        reportType: 'daily',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary: await this.generateDailySummary(detailedStats),
        metrics: this.extractMetrics(detailedStats),
        achievements: await this.getTodaysAchievements(userId, targetDate),
        goals: await this.getActiveGoals(userId),
        recommendations: await this.generateDailyRecommendations(detailedStats),
        charts: this.generateDailyCharts(detailedStats)
      };
    } catch (error) {
      logger.error('Failed to generate daily report:', error);
      throw error;
    }
  }

  // 週次レポートの生成
  async generateWeeklyReport(userId: string): Promise<LearningReport> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const detailedStats = await this.analytics.getDetailedStats(userId, 7);
      
      return {
        reportId: `weekly_${userId}_${startDate.toISOString().split('T')[0]}`,
        userId,
        reportType: 'weekly',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary: await this.generateWeeklySummary(detailedStats),
        metrics: this.extractMetrics(detailedStats),
        achievements: await this.getWeeklyAchievements(userId, startDate),
        goals: await this.getActiveGoals(userId),
        recommendations: await this.generateWeeklyRecommendations(detailedStats),
        charts: this.generateWeeklyCharts(detailedStats)
      };
    } catch (error) {
      logger.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  // 月次レポートの生成
  async generateMonthlyReport(userId: string): Promise<LearningReport> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      const detailedStats = await this.analytics.getDetailedStats(userId, 30);
      
      return {
        reportId: `monthly_${userId}_${startDate.getFullYear()}-${startDate.getMonth() + 1}`,
        userId,
        reportType: 'monthly',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary: await this.generateMonthlySummary(detailedStats),
        metrics: this.extractMetrics(detailedStats),
        achievements: await this.getMonthlyAchievements(userId, startDate),
        goals: await this.getActiveGoals(userId),
        recommendations: await this.generateMonthlyRecommendations(detailedStats),
        charts: this.generateMonthlyCharts(detailedStats)
      };
    } catch (error) {
      logger.error('Failed to generate monthly report:', error);
      throw error;
    }
  }

  // カスタム期間レポートの生成
  async generateCustomReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LearningReport> {
    try {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const detailedStats = await this.analytics.getDetailedStats(userId, days);
      
      return {
        reportId: `custom_${userId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`,
        userId,
        reportType: days <= 7 ? 'weekly' : 'monthly',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary: await this.generateCustomSummary(detailedStats, days),
        metrics: this.extractMetrics(detailedStats),
        achievements: await this.getCustomAchievements(userId, startDate, endDate),
        goals: await this.getActiveGoals(userId),
        recommendations: await this.generateCustomRecommendations(detailedStats, days),
        charts: this.generateCustomCharts(detailedStats, days)
      };
    } catch (error) {
      logger.error('Failed to generate custom report:', error);
      throw error;
    }
  }

  // プライベートヘルパーメソッド
  private async generateDailySummary(stats: any): Promise<LearningReport['summary']> {
    const studyTime = stats.overview.totalStudyTime;
    const accuracy = stats.overview.overallAccuracy;
    
    let headline = '今日も学習お疲れ様でした！';
    let overallRating: LearningReport['summary']['overallRating'] = 'average';
    let keyInsights: string[] = [];

    if (studyTime >= 30 && accuracy >= 0.8) {
      headline = '素晴らしい学習成果です！🌟';
      overallRating = 'excellent';
      keyInsights.push('集中して効率的に学習できました');
    } else if (studyTime >= 15 && accuracy >= 0.6) {
      headline = '良い調子で学習を進めています！👏';
      overallRating = 'good';
      keyInsights.push('着実に理解を深めています');
    } else if (studyTime > 0) {
      headline = '学習を継続できています！📚';
      overallRating = 'average';
      keyInsights.push('毎日の積み重ねが大切です');
    } else {
      headline = '明日は一緒に学習しましょう！💪';
      overallRating = 'needs_improvement';
      keyInsights.push('継続は力なり - 小さな一歩から始めましょう');
    }

    if (stats.performanceTrends.accuracyTrend === 'improving') {
      keyInsights.push('正答率が向上しています');
    }

    if (stats.overview.currentStreak >= 3) {
      keyInsights.push(`${stats.overview.currentStreak}日連続で学習を継続中です`);
    }

    return { headline, keyInsights, overallRating };
  }

  private async generateWeeklySummary(stats: any): Promise<LearningReport['summary']> {
    const avgStudyTime = stats.overview.totalStudyTime / 7;
    const activeDays = stats.overview.activeDays;
    
    let headline = 'この1週間の学習を振り返りましょう';
    let overallRating: LearningReport['summary']['overallRating'] = 'average';
    let keyInsights: string[] = [];

    if (activeDays >= 6 && avgStudyTime >= 20) {
      headline = '素晴らしい1週間でした！🏆';
      overallRating = 'excellent';
      keyInsights.push('ほぼ毎日学習を継続できました');
    } else if (activeDays >= 4 && avgStudyTime >= 15) {
      headline = '良いペースで学習を進めています！📈';
      overallRating = 'good';
      keyInsights.push('安定した学習リズムを築いています');
    } else if (activeDays >= 2) {
      headline = '学習習慣の基礎ができています！🌱';
      overallRating = 'average';
      keyInsights.push('継続することで必ず成果が現れます');
    } else {
      headline = '来週はもう少し頑張ってみましょう！💪';
      overallRating = 'needs_improvement';
      keyInsights.push('小さな目標から始めて習慣化を目指しましょう');
    }

    // パフォーマンストレンド分析
    if (stats.performanceTrends.accuracyTrend === 'improving') {
      keyInsights.push('理解度が着実に向上しています');
    }
    
    if (stats.performanceTrends.engagementTrend === 'increasing') {
      keyInsights.push('学習への取り組みが活発になっています');
    }

    return { headline, keyInsights, overallRating };
  }

  private async generateMonthlySummary(stats: any): Promise<LearningReport['summary']> {
    const totalStudyHours = Math.round(stats.overview.totalStudyTime / 60 * 10) / 10;
    const activeDays = stats.overview.activeDays;
    
    let headline = 'この1ヶ月の成長を確認しましょう';
    let overallRating: LearningReport['summary']['overallRating'] = 'average';
    let keyInsights: string[] = [];

    if (activeDays >= 20 && totalStudyHours >= 10) {
      headline = '驚異的な成長を遂げました！🚀';
      overallRating = 'excellent';
      keyInsights.push(`${totalStudyHours}時間の学習で大きく成長しました`);
    } else if (activeDays >= 15 && totalStudyHours >= 6) {
      headline = '着実な成長が見られます！📊';
      overallRating = 'good';
      keyInsights.push('継続的な努力が実を結んでいます');
    } else if (activeDays >= 8) {
      headline = '学習の土台が形成されています！🏗️';
      overallRating = 'average';
      keyInsights.push('学習習慣の基礎ができました');
    } else {
      headline = '来月はより積極的に取り組みましょう！🎯';
      overallRating = 'needs_improvement';
      keyInsights.push('継続的な学習でより大きな成果を目指しましょう');
    }

    // 長期トレンド分析
    const topicProgress = Object.values(stats.topicBreakdown);
    const improvingTopics = topicProgress.filter((topic: any) => topic.progression > 0);
    
    if (improvingTopics.length >= 3) {
      keyInsights.push('複数の分野で進歩が見られます');
    }

    if (stats.overview.currentStreak >= 7) {
      keyInsights.push(`${stats.overview.currentStreak}日連続学習の素晴らしい記録です`);
    }

    return { headline, keyInsights, overallRating };
  }

  private async generateCustomSummary(stats: any, days: number): Promise<LearningReport['summary']> {
    // カスタム期間用の汎用的なサマリー生成
    if (days <= 7) {
      return this.generateWeeklySummary(stats);
    } else {
      return this.generateMonthlySummary(stats);
    }
  }

  private extractMetrics(stats: any): LearningReport['metrics'] {
    const totalDays = stats.dailyProgress.length;
    const avgStudyTime = totalDays > 0 ? stats.overview.totalStudyTime / totalDays : 0;
    
    // 最強・最弱トピック
    const topics = Object.entries(stats.topicBreakdown);
    const strongestTopic = topics.reduce((max, [topic, data]: [string, any]) => 
      data.accuracy > (stats.topicBreakdown[max]?.accuracy || 0) ? topic : max
    , topics[0]?.[0] || 'algebra');
    
    const weakestTopic = topics.reduce((min, [topic, data]: [string, any]) => 
      data.accuracy < (stats.topicBreakdown[min]?.accuracy || 1) ? topic : min
    , topics[0]?.[0] || 'algebra');

    return {
      studyTime: {
        total: stats.overview.totalStudyTime,
        average: avgStudyTime,
        trend: this.calculateStudyTimeTrend(stats.dailyProgress)
      },
      performance: {
        accuracy: stats.overview.overallAccuracy,
        improvement: this.calculateImprovement(stats.dailyProgress),
        strongestTopic,
        weakestTopic
      },
      engagement: {
        activeDays: stats.overview.activeDays,
        streak: stats.overview.currentStreak,
        consistency: stats.overview.activeDays / stats.dailyProgress.length
      }
    };
  }

  private calculateStudyTimeTrend(dailyProgress: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (dailyProgress.length < 3) return 'stable';
    
    const recent = dailyProgress.slice(-3).reduce((sum, day) => sum + day.studyTime, 0) / 3;
    const earlier = dailyProgress.slice(0, 3).reduce((sum, day) => sum + day.studyTime, 0) / 3;
    
    if (recent > earlier * 1.1) return 'increasing';
    if (recent < earlier * 0.9) return 'decreasing';
    return 'stable';
  }

  private calculateImprovement(dailyProgress: any[]): number {
    if (dailyProgress.length < 2) return 0;
    
    const recent = dailyProgress.slice(-3).reduce((sum, day) => sum + day.accuracy, 0) / Math.min(3, dailyProgress.length);
    const earlier = dailyProgress.slice(0, 3).reduce((sum, day) => sum + day.accuracy, 0) / Math.min(3, dailyProgress.length);
    
    return recent - earlier;
  }

  // 実績取得メソッド（スタブ）
  private async getTodaysAchievements(userId: string, date: Date): Promise<LearningReport['achievements']> {
    return []; // 実装は後で
  }

  private async getWeeklyAchievements(userId: string, startDate: Date): Promise<LearningReport['achievements']> {
    return []; // 実装は後で
  }

  private async getMonthlyAchievements(userId: string, startDate: Date): Promise<LearningReport['achievements']> {
    return []; // 実装は後で
  }

  private async getCustomAchievements(userId: string, startDate: Date, endDate: Date): Promise<LearningReport['achievements']> {
    return []; // 実装は後で
  }

  // 目標取得メソッド（スタブ）
  private async getActiveGoals(userId: string): Promise<LearningReport['goals']> {
    return [
      {
        title: '毎日30分学習',
        description: '継続的な学習習慣を身につける',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progress: 0.6,
        isCompleted: false
      }
    ];
  }

  // 推薦生成メソッド（スタブ）
  private async generateDailyRecommendations(stats: any): Promise<LearningReport['recommendations']> {
    return this.generateRecommendations(stats, 'daily');
  }

  private async generateWeeklyRecommendations(stats: any): Promise<LearningReport['recommendations']> {
    return this.generateRecommendations(stats, 'weekly');
  }

  private async generateMonthlyRecommendations(stats: any): Promise<LearningReport['recommendations']> {
    return this.generateRecommendations(stats, 'monthly');
  }

  private async generateCustomRecommendations(stats: any, days: number): Promise<LearningReport['recommendations']> {
    return this.generateRecommendations(stats, days <= 7 ? 'weekly' : 'monthly');
  }

  private generateRecommendations(stats: any, period: string): LearningReport['recommendations'] {
    const recommendations = [];

    // 学習時間が少ない場合
    if (stats.overview.totalStudyTime < 60) {
      recommendations.push({
        type: 'schedule' as const,
        title: '学習時間を増やしましょう',
        description: '短時間でも毎日継続することが重要です',
        priority: 'high' as const,
        actionItems: [
          '1日15分から始めてみましょう',
          '決まった時間に学習する習慣をつけましょう',
          '小さな目標を設定しましょう'
        ]
      });
    }

    // 苦手分野のフォロー
    const topics = Object.entries(stats.topicBreakdown);
    const weakTopic = topics.find(([_, data]: [string, any]) => data.accuracy < 0.6);
    
    if (weakTopic) {
      const [topic, _] = weakTopic;
      recommendations.push({
        type: 'topic_focus' as const,
        title: `${this.getTopicDisplayName(topic)}の復習をしましょう`,
        description: `${this.getTopicDisplayName(topic)}の理解度向上が必要です`,
        priority: 'high' as const,
        actionItems: [
          '基本概念から見直しましょう',
          '簡単な問題から始めて自信をつけましょう',
          'わからないところは遠慮なく質問しましょう'
        ]
      });
    }

    return recommendations;
  }

  // チャート生成メソッド（スタブ）
  private generateDailyCharts(stats: any) {
    return this.generateCharts(stats);
  }

  private generateWeeklyCharts(stats: any) {
    return this.generateCharts(stats);
  }

  private generateMonthlyCharts(stats: any) {
    return this.generateCharts(stats);
  }

  private generateCustomCharts(stats: any, days: number) {
    return this.generateCharts(stats);
  }

  private generateCharts(stats: any) {
    return {
      progressChart: {
        type: 'line',
        data: stats.dailyProgress.map((day: any) => ({
          date: day.date,
          accuracy: day.accuracy,
          studyTime: day.studyTime
        }))
      },
      topicBreakdown: {
        type: 'pie',
        data: Object.entries(stats.topicBreakdown).map(([topic, data]: [string, any]) => ({
          topic: this.getTopicDisplayName(topic),
          studyTime: data.studyTime
        }))
      },
      timeDistribution: {
        type: 'bar',
        data: stats.dailyProgress.map((day: any) => ({
          date: day.date,
          studyTime: day.studyTime
        }))
      }
    };
  }

  private getTopicDisplayName(topic: string): string {
    const displayNames: Record<string, string> = {
      algebra: '代数',
      geometry: '幾何',
      functions: '関数',
      probability: '確率'
    };
    return displayNames[topic] || topic;
  }
}