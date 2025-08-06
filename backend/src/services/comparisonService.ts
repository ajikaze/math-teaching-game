import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsService } from './analyticsService';

const prisma = new PrismaClient();

export interface PeerComparison {
  userStats: {
    studyTime: number;
    accuracy: number;
    problemsPerDay: number;
    streak: number;
    level: number;
  };
  peerAverages: {
    studyTime: number;
    accuracy: number;
    problemsPerDay: number;
    streak: number;
    level: number;
  };
  percentiles: {
    studyTime: number;
    accuracy: number;
    problemsPerDay: number;
    streak: number;
    level: number;
  };
  ranking: {
    overallRank: number;
    totalUsers: number;
    topPercentage: number;
  };
  insights: string[];
  recommendations: Array<{
    type: 'improvement' | 'strength' | 'motivation';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface ProgressComparison {
  userId: string;
  timeRange: {
    start: Date;
    end: Date;
    previousStart: Date;
    previousEnd: Date;
  };
  currentPeriod: {
    studyTime: number;
    accuracy: number;
    problemsSolved: number;
    topicProgress: Record<string, number>;
  };
  previousPeriod: {
    studyTime: number;
    accuracy: number;
    problemsSolved: number;
    topicProgress: Record<string, number>;
  };
  changes: {
    studyTime: {
      absolute: number;
      percentage: number;
      trend: 'improved' | 'declined' | 'stable';
    };
    accuracy: {
      absolute: number;
      percentage: number;
      trend: 'improved' | 'declined' | 'stable';
    };
    problemsSolved: {
      absolute: number;
      percentage: number;
      trend: 'improved' | 'declined' | 'stable';
    };
    topicChanges: Record<string, {
      absolute: number;
      percentage: number;
      trend: 'improved' | 'declined' | 'stable';
    }>;
  };
  summary: {
    overallTrend: 'improving' | 'declining' | 'stable';
    strongestImprovement: string;
    biggestChallenge: string;
    keyInsights: string[];
    motivationalMessage: string;
  };
}

export class ComparisonService {
  private analytics: AnalyticsService;

  constructor() {
    this.analytics = new AnalyticsService();
  }

  // ピア比較分析
  async getPeerComparison(userId: string, days: number = 30): Promise<PeerComparison> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // ユーザーの統計を取得
      const userStats = await this.analytics.getDetailedStats(userId, days);
      
      // 同期間の全ユーザー統計を取得
      const allUserStats = await this.getAllUsersStats(startDate, endDate);
      
      // ユーザーレベルを取得
      const userLevel = await this.getUserLevel(userId);

      // 比較データを構築
      const userMetrics = {
        studyTime: userStats.overview.totalStudyTime,
        accuracy: userStats.overview.overallAccuracy,
        problemsPerDay: userStats.overview.totalProblems / days,
        streak: userStats.overview.currentStreak,
        level: userLevel
      };

      const peerAverages = this.calculatePeerAverages(allUserStats);
      const percentiles = this.calculatePercentiles(userMetrics, allUserStats);
      const ranking = this.calculateRanking(userMetrics, allUserStats);
      const insights = this.generatePeerInsights(userMetrics, peerAverages, percentiles);
      const recommendations = this.generatePeerRecommendations(userMetrics, peerAverages, percentiles);

      return {
        userStats: userMetrics,
        peerAverages,
        percentiles,
        ranking,
        insights,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get peer comparison:', error);
      throw error;
    }
  }

  // 進捗期間比較
  async getProgressComparison(userId: string, currentDays: number = 30): Promise<ProgressComparison> {
    try {
      const endDate = new Date();
      const currentStart = new Date(endDate.getTime() - currentDays * 24 * 60 * 60 * 1000);
      const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      const previousStart = new Date(previousEnd.getTime() - currentDays * 24 * 60 * 60 * 1000);

      // 現在期間と前期間の統計を取得
      const [currentStats, previousStats] = await Promise.all([
        this.analytics.getDetailedStats(userId, currentDays),
        this.getPeriodStats(userId, previousStart, previousEnd)
      ]);

      // 期間データを構築
      const currentPeriod = {
        studyTime: currentStats.overview.totalStudyTime,
        accuracy: currentStats.overview.overallAccuracy,
        problemsSolved: currentStats.overview.totalProblems,
        topicProgress: this.extractTopicProgress(currentStats.topicBreakdown)
      };

      const previousPeriod = {
        studyTime: previousStats.totalStudyTime,
        accuracy: previousStats.overallAccuracy,
        problemsSolved: previousStats.totalProblems,
        topicProgress: this.extractTopicProgress(previousStats.topicBreakdown)
      };

      // 変化を計算
      const changes = this.calculateChanges(currentPeriod, previousPeriod);
      
      // サマリーを生成
      const summary = this.generateProgressSummary(changes, currentPeriod, previousPeriod);

      return {
        userId,
        timeRange: {
          start: currentStart,
          end: endDate,
          previousStart,
          previousEnd
        },
        currentPeriod,
        previousPeriod,
        changes,
        summary
      };
    } catch (error) {
      logger.error('Failed to get progress comparison:', error);
      throw error;
    }
  }

  // プライベートヘルパーメソッド
  private async getAllUsersStats(startDate: Date, endDate: Date) {
    const sessions = await prisma.learningSession.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate }
      },
      include: { user: true }
    });

    const userStatsMap = new Map();
    
    for (const session of sessions) {
      const userId = session.userId;
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          studyTime: 0,
          accuracy: 0,
          totalProblems: 0,
          correctAnswers: 0,
          streak: 0,
          level: 1
        });
      }
      
      const stats = userStatsMap.get(userId);
      stats.studyTime += session.duration || 0;
      stats.totalProblems += session.problemsSolved;
      stats.correctAnswers += session.correctAnswers;
    }

    // 精度とレベルを計算
    for (const [userId, stats] of userStatsMap) {
      stats.accuracy = stats.totalProblems > 0 ? stats.correctAnswers / stats.totalProblems : 0;
      stats.level = await this.getUserLevel(userId);
      stats.streak = await this.getUserStreak(userId);
    }

    return Array.from(userStatsMap.values());
  }

  private calculatePeerAverages(allUserStats: any[]) {
    if (allUserStats.length === 0) {
      return {
        studyTime: 0,
        accuracy: 0,
        problemsPerDay: 0,
        streak: 0,
        level: 1
      };
    }

    const totals = allUserStats.reduce((acc, stats) => ({
      studyTime: acc.studyTime + stats.studyTime,
      accuracy: acc.accuracy + stats.accuracy,
      problemsPerDay: acc.problemsPerDay + (stats.totalProblems / 30),
      streak: acc.streak + stats.streak,
      level: acc.level + stats.level
    }), { studyTime: 0, accuracy: 0, problemsPerDay: 0, streak: 0, level: 0 });

    const count = allUserStats.length;
    return {
      studyTime: totals.studyTime / count,
      accuracy: totals.accuracy / count,
      problemsPerDay: totals.problemsPerDay / count,
      streak: totals.streak / count,
      level: totals.level / count
    };
  }

  private calculatePercentiles(userMetrics: any, allUserStats: any[]) {
    const calculatePercentile = (value: number, values: number[]) => {
      const sorted = values.sort((a, b) => a - b);
      const index = sorted.findIndex(v => v >= value);
      return index === -1 ? 100 : (index / sorted.length) * 100;
    };

    return {
      studyTime: calculatePercentile(userMetrics.studyTime, allUserStats.map(s => s.studyTime)),
      accuracy: calculatePercentile(userMetrics.accuracy, allUserStats.map(s => s.accuracy)),
      problemsPerDay: calculatePercentile(userMetrics.problemsPerDay, allUserStats.map(s => s.totalProblems / 30)),
      streak: calculatePercentile(userMetrics.streak, allUserStats.map(s => s.streak)),
      level: calculatePercentile(userMetrics.level, allUserStats.map(s => s.level))
    };
  }

  private calculateRanking(userMetrics: any, allUserStats: any[]) {
    // 総合スコアを計算（各指標を正規化して合計）
    const normalizeScore = (value: number, values: number[]) => {
      const max = Math.max(...values);
      const min = Math.min(...values);
      return max > min ? (value - min) / (max - min) : 0;
    };

    const userScore = 
      normalizeScore(userMetrics.studyTime, allUserStats.map(s => s.studyTime)) * 0.3 +
      normalizeScore(userMetrics.accuracy, allUserStats.map(s => s.accuracy)) * 0.3 +
      normalizeScore(userMetrics.streak, allUserStats.map(s => s.streak)) * 0.2 +
      normalizeScore(userMetrics.level, allUserStats.map(s => s.level)) * 0.2;

    const allScores = allUserStats.map(stats =>
      normalizeScore(stats.studyTime, allUserStats.map(s => s.studyTime)) * 0.3 +
      normalizeScore(stats.accuracy, allUserStats.map(s => s.accuracy)) * 0.3 +
      normalizeScore(stats.streak, allUserStats.map(s => s.streak)) * 0.2 +
      normalizeScore(stats.level, allUserStats.map(s => s.level)) * 0.2
    );

    const rank = allScores.filter(score => score > userScore).length + 1;
    const totalUsers = allUserStats.length;
    const topPercentage = Math.round((rank / totalUsers) * 100);

    return { overallRank: rank, totalUsers, topPercentage };
  }

  private generatePeerInsights(userMetrics: any, peerAverages: any, percentiles: any): string[] {
    const insights = [];

    if (percentiles.studyTime >= 80) {
      insights.push('学習時間が同世代の上位20%に入っています！');
    } else if (percentiles.studyTime < 30) {
      insights.push('学習時間を増やすことで更なる成長が期待できます');
    }

    if (percentiles.accuracy >= 90) {
      insights.push('正答率が非常に高く、理解度が優秀です');
    } else if (percentiles.accuracy < 40) {
      insights.push('基礎をしっかり固めることで正答率向上が見込めます');
    }

    if (userMetrics.streak > peerAverages.streak * 1.5) {
      insights.push('継続学習の習慣が他の学習者より優れています');
    }

    if (percentiles.level >= 70) {
      insights.push('レベル進行が順調で、着実に成長しています');
    }

    return insights.length > 0 ? insights : ['継続的な学習で必ず成果が現れます'];
  }

  private generatePeerRecommendations(userMetrics: any, peerAverages: any, percentiles: any) {
    const recommendations = [];

    if (percentiles.studyTime < 50) {
      recommendations.push({
        type: 'improvement' as const,
        title: '学習時間の増加',
        description: `平均学習時間は${Math.round(peerAverages.studyTime)}分です。少しずつ学習時間を延ばしてみましょう`,
        priority: 'high' as const
      });
    }

    if (percentiles.accuracy < 40) {
      recommendations.push({
        type: 'improvement' as const,
        title: '理解度の向上',
        description: '基本概念の復習と反復練習で正答率を上げましょう',
        priority: 'high' as const
      });
    }

    if (percentiles.streak >= 80) {
      recommendations.push({
        type: 'strength' as const,
        title: '継続力が強み',
        description: '素晴らしい継続習慣を維持し、更なる高みを目指しましょう',
        priority: 'low' as const
      });
    }

    if (percentiles.accuracy >= 90) {
      recommendations.push({
        type: 'strength' as const,
        title: '高い理解度',
        description: '優秀な理解度です。より難しい問題にもチャレンジしてみましょう',
        priority: 'medium' as const
      });
    }

    return recommendations;
  }

  private async getPeriodStats(userId: string, startDate: Date, endDate: Date) {
    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        startTime: { gte: startDate, lte: endDate }
      }
    });

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        timestamp: { gte: startDate, lte: endDate }
      }
    });

    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalProblems = sessions.reduce((sum, s) => sum + s.problemsSolved, 0);
    const correctAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const overallAccuracy = totalProblems > 0 ? correctAnswers / totalProblems : 0;

    // トピック別統計
    const topicBreakdown = this.calculateTopicBreakdownForPeriod(sessions, activities);

    return {
      totalStudyTime,
      totalProblems,
      correctAnswers,
      overallAccuracy,
      topicBreakdown
    };
  }

  private calculateTopicBreakdownForPeriod(sessions: any[], activities: any[]) {
    const topics = ['algebra', 'geometry', 'functions', 'probability'];
    const breakdown: any = {};

    for (const topic of topics) {
      const topicSessions = sessions.filter(s => s.topic === topic);
      const topicActivities = activities.filter(a => a.topic === topic);
      
      const studyTime = topicSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const problemsSolved = topicActivities.length;
      const correctAnswers = topicActivities.filter(a => a.isCorrect === true).length;
      const accuracy = problemsSolved > 0 ? correctAnswers / problemsSolved : 0;

      breakdown[topic] = { studyTime, problemsSolved, accuracy };
    }

    return breakdown;
  }

  private extractTopicProgress(topicBreakdown: any): Record<string, number> {
    const progress: Record<string, number> = {};
    for (const [topic, data] of Object.entries(topicBreakdown)) {
      progress[topic] = (data as any).accuracy;
    }
    return progress;
  }

  private calculateChanges(current: any, previous: any) {
    const calculateChange = (currentVal: number, previousVal: number) => {
      const absolute = currentVal - previousVal;
      const percentage = previousVal > 0 ? (absolute / previousVal) * 100 : 0;
      let trend: 'improved' | 'declined' | 'stable' = 'stable';
      
      if (Math.abs(percentage) > 5) {
        trend = percentage > 0 ? 'improved' : 'declined';
      }
      
      return { absolute, percentage, trend };
    };

    const topicChanges: Record<string, any> = {};
    for (const topic in current.topicProgress) {
      topicChanges[topic] = calculateChange(
        current.topicProgress[topic],
        previous.topicProgress[topic] || 0
      );
    }

    return {
      studyTime: calculateChange(current.studyTime, previous.studyTime),
      accuracy: calculateChange(current.accuracy, previous.accuracy),
      problemsSolved: calculateChange(current.problemsSolved, previous.problemsSolved),
      topicChanges
    };
  }

  private generateProgressSummary(changes: any, current: any, previous: any) {
    // 全体的な傾向を判定
    const improvementCount = Object.values(changes).filter((change: any) => change.trend === 'improved').length;
    const declineCount = Object.values(changes).filter((change: any) => change.trend === 'declined').length;
    
    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvementCount > declineCount) {
      overallTrend = 'improving';
    } else if (declineCount > improvementCount) {
      overallTrend = 'declining';
    }

    // 最も改善された分野
    const improvements = Object.entries(changes.topicChanges)
      .filter(([_, change]: [string, any]) => change.trend === 'improved')
      .sort(([_, a], [__, b]) => (b as any).percentage - (a as any).percentage);
    
    const strongestImprovement = improvements.length > 0 
      ? this.getTopicDisplayName(improvements[0][0])
      : '継続学習';

    // 最も課題のある分野
    const challenges = Object.entries(changes.topicChanges)
      .filter(([_, change]: [string, any]) => change.trend === 'declined')
      .sort(([_, a], [__, b]) => (a as any).percentage - (b as any).percentage);
    
    const biggestChallenge = challenges.length > 0 
      ? this.getTopicDisplayName(challenges[0][0])
      : '現在の学習継続';

    // キーインサイト
    const keyInsights = [];
    if (changes.studyTime.trend === 'improved') {
      keyInsights.push(`学習時間が${Math.round(changes.studyTime.percentage)}%向上しました`);
    }
    if (changes.accuracy.trend === 'improved') {
      keyInsights.push(`正答率が${Math.round(changes.accuracy.percentage)}%改善しました`);
    }
    if (changes.problemsSolved.trend === 'improved') {
      keyInsights.push(`解いた問題数が${Math.round(changes.problemsSolved.percentage)}%増加しました`);
    }

    // モチベーションメッセージ
    let motivationalMessage = '継続は力なり！この調子で頑張りましょう！';
    if (overallTrend === 'improving') {
      motivationalMessage = '素晴らしい成長です！この調子を維持しましょう！🌟';
    } else if (overallTrend === 'declining') {
      motivationalMessage = '一時的な停滞は成長の証拠です。諦めずに続けましょう！💪';
    }

    return {
      overallTrend,
      strongestImprovement,
      biggestChallenge,
      keyInsights,
      motivationalMessage
    };
  }

  private async getUserLevel(userId: string): Promise<number> {
    const characterState = await prisma.characterState.findUnique({
      where: { userId }
    });
    return characterState?.level || 1;
  }

  private async getUserStreak(userId: string): Promise<number> {
    const latestDailyStat = await prisma.dailyStats.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    return latestDailyStat?.longestStreak || 0;
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