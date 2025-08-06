import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LearningSessionData {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  topic: string;
  problemsSolved: number;
  correctAnswers: number;
  accuracy: number;
  totalScore: number;
  averageResponseTime: number;
}

export interface DetailedStats {
  userId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  overview: {
    totalStudyTime: number; // minutes
    totalProblems: number;
    totalCorrectAnswers: number;
    overallAccuracy: number;
    averageScore: number;
    activeDays: number;
    currentStreak: number;
  };
  topicBreakdown: {
    [topic: string]: {
      studyTime: number;
      problemsSolved: number;
      accuracy: number;
      averageScore: number;
      progression: number; // improvement over time
    };
  };
  dailyProgress: Array<{
    date: string;
    studyTime: number;
    problemsSolved: number;
    accuracy: number;
    score: number;
    streak: number;
  }>;
  performanceTrends: {
    accuracyTrend: 'improving' | 'declining' | 'stable';
    speedTrend: 'improving' | 'declining' | 'stable';
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface ComparisonStats {
  userStats: any;
  peerComparison: {
    percentile: number;
    averageStudyTime: number;
    averageAccuracy: number;
    averageProblemsPerDay: number;
  };
  recommendations: string[];
}

export class AnalyticsService {
  // 学習セッションの開始
  async startLearningSession(userId: string, topic: string): Promise<string> {
    try {
      const session = await prisma.learningSession.create({
        data: {
          userId,
          topic,
          startTime: new Date()
        }
      });
      
      logger.info(`Learning session started for user ${userId}, topic: ${topic}`);
      return session.id;
    } catch (error) {
      logger.error('Failed to start learning session:', error);
      throw error;
    }
  }

  // 学習セッションの終了
  async endLearningSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        include: { activities: true }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000 / 60); // minutes
      
      // セッション統計を計算
      const activities = session.activities;
      const correctAnswers = activities.filter(a => a.isCorrect === true).length;
      const totalScore = activities.reduce((sum, a) => sum + a.score, 0);
      const avgResponseTime = activities.length > 0 
        ? activities.reduce((sum, a) => sum + (a.responseTime || 0), 0) / activities.length 
        : 0;

      await prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          duration,
          problemsSolved: activities.length,
          correctAnswers,
          totalScore,
          averageResponseTime: avgResponseTime
        }
      });

      // デイリー統計を更新
      await this.updateDailyStats(session.userId, endTime, {
        studyTime: duration,
        problemsSolved: activities.length,
        correctAnswers,
        topics: [session.topic],
        averageScore: activities.length > 0 ? totalScore / activities.length : 0
      });

      logger.info(`Learning session ${sessionId} ended successfully`);
    } catch (error) {
      logger.error('Failed to end learning session:', error);
      throw error;
    }
  }

  // 学習活動の記録
  async recordLearningActivity(
    sessionId: string,
    userId: string,
    activityData: {
      activityType: string;
      topic: string;
      difficulty: string;
      content: string;
      responseTime?: number;
      isCorrect?: boolean;
      score: number;
      emotionState?: string;
    }
  ): Promise<void> {
    try {
      await prisma.learningActivity.create({
        data: {
          sessionId,
          userId,
          ...activityData,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to record learning activity:', error);
      throw error;
    }
  }

  // 詳細統計の取得
  async getDetailedStats(userId: string, days: number = 30): Promise<DetailedStats> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const [sessions, dailyStats, activities] = await Promise.all([
        prisma.learningSession.findMany({
          where: {
            userId,
            startTime: {
              gte: startDate,
              lte: endDate
            }
          },
          include: { activities: true }
        }),
        prisma.dailyStats.findMany({
          where: {
            userId,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { date: 'asc' }
        }),
        prisma.learningActivity.findMany({
          where: {
            userId,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { timestamp: 'asc' }
        })
      ]);

      // 概要統計の計算
      const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalProblems = sessions.reduce((sum, s) => sum + s.problemsSolved, 0);
      const totalCorrectAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
      const overallAccuracy = totalProblems > 0 ? totalCorrectAnswers / totalProblems : 0;
      const averageScore = sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.totalScore, 0) / sessions.length 
        : 0;
      const activeDays = new Set(sessions.map(s => s.startTime.toDateString())).size;
      const currentStreak = this.calculateCurrentStreak(dailyStats);

      // トピック別統計
      const topicBreakdown = this.calculateTopicBreakdown(sessions, activities);

      // 日別進捗
      const dailyProgress = this.calculateDailyProgress(dailyStats);

      // パフォーマンストレンド
      const performanceTrends = this.calculatePerformanceTrends(activities);

      return {
        userId,
        timeRange: { start: startDate, end: endDate },
        overview: {
          totalStudyTime,
          totalProblems,
          totalCorrectAnswers,
          overallAccuracy,
          averageScore,
          activeDays,
          currentStreak
        },
        topicBreakdown,
        dailyProgress,
        performanceTrends
      };
    } catch (error) {
      logger.error('Failed to get detailed stats:', error);
      throw error;
    }
  }

  // デイリー統計の更新
  private async updateDailyStats(
    userId: string,
    date: Date,
    data: {
      studyTime: number;
      problemsSolved: number;
      correctAnswers: number;
      topics: string[];
      averageScore: number;
    }
  ): Promise<void> {
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    try {
      const existing = await prisma.dailyStats.findUnique({
        where: {
          userId_date: {
            userId,
            date: dateKey
          }
        }
      });

      const topicsArray = [...new Set([
        ...(existing ? JSON.parse(existing.topicsStudied) : []),
        ...data.topics
      ])];

      if (existing) {
        // 既存データを更新
        await prisma.dailyStats.update({
          where: {
            userId_date: {
              userId,
              date: dateKey
            }
          },
          data: {
            studyTime: existing.studyTime + data.studyTime,
            problemsSolved: existing.problemsSolved + data.problemsSolved,
            correctAnswers: existing.correctAnswers + data.correctAnswers,
            topicsStudied: JSON.stringify(topicsArray),
            averageScore: (existing.averageScore + data.averageScore) / 2,
            longestStreak: Math.max(existing.longestStreak, this.calculateStreakForDay(data))
          }
        });
      } else {
        // 新規データを作成
        await prisma.dailyStats.create({
          data: {
            userId,
            date: dateKey,
            studyTime: data.studyTime,
            problemsSolved: data.problemsSolved,
            correctAnswers: data.correctAnswers,
            topicsStudied: JSON.stringify(topicsArray),
            averageScore: data.averageScore,
            longestStreak: this.calculateStreakForDay(data)
          }
        });
      }
    } catch (error) {
      logger.error('Failed to update daily stats:', error);
      throw error;
    }
  }

  // プライベートヘルパーメソッド
  private calculateCurrentStreak(dailyStats: any[]): number {
    if (dailyStats.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    // 最新から遡って連続日数を計算
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      const statDate = new Date(dailyStats[i].date);
      const daysDiff = Math.floor((today.getTime() - statDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateTopicBreakdown(sessions: any[], activities: any[]) {
    const topics = ['algebra', 'geometry', 'functions', 'probability'];
    const breakdown: any = {};

    for (const topic of topics) {
      const topicSessions = sessions.filter(s => s.topic === topic);
      const topicActivities = activities.filter(a => a.topic === topic);
      
      const studyTime = topicSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const problemsSolved = topicActivities.length;
      const correctAnswers = topicActivities.filter(a => a.isCorrect === true).length;
      const accuracy = problemsSolved > 0 ? correctAnswers / problemsSolved : 0;
      const averageScore = problemsSolved > 0 
        ? topicActivities.reduce((sum, a) => sum + a.score, 0) / problemsSolved 
        : 0;

      breakdown[topic] = {
        studyTime,
        problemsSolved,
        accuracy,
        averageScore,
        progression: this.calculateProgression(topicActivities)
      };
    }

    return breakdown;
  }

  private calculateDailyProgress(dailyStats: any[]) {
    return dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      studyTime: stat.studyTime,
      problemsSolved: stat.problemsSolved,
      accuracy: stat.problemsSolved > 0 ? stat.correctAnswers / stat.problemsSolved : 0,
      score: stat.averageScore,
      streak: stat.longestStreak
    }));
  }

  private calculatePerformanceTrends(activities: any[]) {
    if (activities.length < 10) {
      return {
        accuracyTrend: 'stable' as const,
        speedTrend: 'stable' as const,
        engagementTrend: 'stable' as const
      };
    }

    // 前半と後半で比較
    const firstHalf = activities.slice(0, Math.floor(activities.length / 2));
    const secondHalf = activities.slice(Math.floor(activities.length / 2));

    const firstAccuracy = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
    const secondAccuracy = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;

    const firstSpeed = firstHalf.reduce((sum, a) => sum + (a.responseTime || 0), 0) / firstHalf.length;
    const secondSpeed = secondHalf.reduce((sum, a) => sum + (a.responseTime || 0), 0) / secondHalf.length;

    return {
      accuracyTrend: this.getTrend(firstAccuracy, secondAccuracy),
      speedTrend: this.getTrend(firstSpeed, secondSpeed, true), // lower is better for speed
      engagementTrend: (secondHalf.length > firstHalf.length ? 'increasing' : 'decreasing') as 'increasing' | 'decreasing' | 'stable'
    };
  }

  private getTrend(first: number, second: number, lowerIsBetter = false): 'improving' | 'declining' | 'stable' {
    const threshold = 0.05; // 5% threshold
    const improvement = lowerIsBetter ? first - second : second - first;
    
    if (improvement > threshold) return 'improving';
    if (improvement < -threshold) return 'declining';
    return 'stable';
  }

  private calculateProgression(activities: any[]): number {
    if (activities.length < 5) return 0;
    
    const recent = activities.slice(-5);
    const earlier = activities.slice(0, 5);
    
    const recentScore = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    const earlierScore = earlier.reduce((sum, a) => sum + a.score, 0) / earlier.length;
    
    return recentScore - earlierScore;
  }

  private calculateStreakForDay(data: any): number {
    return data.correctAnswers; // Simplified streak calculation
  }
}