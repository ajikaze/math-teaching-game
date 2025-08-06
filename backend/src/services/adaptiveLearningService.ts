import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LearningMetrics {
  userId: string;
  totalProblems: number;
  correctAnswers: number;
  averageResponseTime: number;
  topicProficiency: {
    algebra: number;
    geometry: number;
    functions: number;
    probability: number;
  };
  difficultyProgression: {
    currentLevel: number;
    suggestedLevel: number;
  };
  learningVelocity: number; // Problems solved per session
  strugglingTopics: string[];
  masteredTopics: string[];
}

export interface AdaptiveRecommendation {
  recommendedTopic: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  questionType: 'concept' | 'application' | 'problem_solving';
  focusAreas: string[];
  reasoning: string;
}

export class AdaptiveLearningService {
  // 学習メトリクスの計算
  async calculateLearningMetrics(userId: string): Promise<LearningMetrics> {
    try {
      const [characterState, conversations, recentActivity] = await Promise.all([
        prisma.characterState.findUnique({ where: { userId } }),
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 100
        }),
        prisma.conversation.findMany({
          where: { 
            userId,
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      if (!characterState) {
        throw new Error('Character state not found');
      }

      // 基本メトリクス
      const totalProblems = characterState.totalProblems;
      const correctAnswers = Math.floor(totalProblems * 0.7); // Estimate based on experience gain
      
      // トピック別習熟度
      const topicProficiency = {
        algebra: characterState.understandingAlgebra,
        geometry: characterState.understandingGeometry,
        functions: characterState.understandingFunctions,
        probability: characterState.understandingProbability,
      };

      // 学習速度の計算
      const learningVelocity = recentActivity.length / 7; // Problems per day average

      // 苦手・得意分野の判定
      const topics = Object.entries(topicProficiency);
      const strugglingTopics = topics
        .filter(([_, score]) => score < 30)
        .map(([topic, _]) => topic);
      
      const masteredTopics = topics
        .filter(([_, score]) => score >= 80)
        .map(([topic, _]) => topic);

      // 難易度進行の計算
      const averageProficiency = Object.values(topicProficiency).reduce((a, b) => a + b, 0) / 4;
      const suggestedLevel = this.calculateSuggestedDifficulty(averageProficiency, characterState.level);

      return {
        userId,
        totalProblems,
        correctAnswers,
        averageResponseTime: 45, // Estimated seconds
        topicProficiency,
        difficultyProgression: {
          currentLevel: characterState.level,
          suggestedLevel
        },
        learningVelocity,
        strugglingTopics,
        masteredTopics
      };
    } catch (error) {
      logger.error('Failed to calculate learning metrics:', error);
      throw error;
    }
  }

  // 適応的推薦の生成
  async generateRecommendations(userId: string): Promise<AdaptiveRecommendation[]> {
    try {
      const metrics = await this.calculateLearningMetrics(userId);
      const recommendations: AdaptiveRecommendation[] = [];

      // 苦手分野の重点学習
      for (const topic of metrics.strugglingTopics) {
        recommendations.push({
          recommendedTopic: topic,
          difficultyLevel: 'beginner',
          questionType: 'concept',
          focusAreas: [topic],
          reasoning: `${topic}の理解度が低いため、基礎概念の復習をお勧めします`
        });
      }

      // バランス学習（全分野平均的に）
      if (metrics.strugglingTopics.length === 0) {
        const topics = ['algebra', 'geometry', 'functions', 'probability'];
        const weakestTopic = topics.reduce((a, b) => 
          metrics.topicProficiency[a as keyof typeof metrics.topicProficiency] < 
          metrics.topicProficiency[b as keyof typeof metrics.topicProficiency] ? a : b
        );

        const difficulty = this.getDifficultyForTopic(
          metrics.topicProficiency[weakestTopic as keyof typeof metrics.topicProficiency]
        );

        recommendations.push({
          recommendedTopic: weakestTopic,
          difficultyLevel: difficulty,
          questionType: 'application',
          focusAreas: [weakestTopic],
          reasoning: `全体的にバランス良く学習されています。${weakestTopic}をさらに伸ばしましょう`
        });
      }

      // 発展学習（得意分野のさらなる向上）
      for (const topic of metrics.masteredTopics) {
        recommendations.push({
          recommendedTopic: topic,
          difficultyLevel: 'advanced',
          questionType: 'problem_solving',
          focusAreas: [topic],
          reasoning: `${topic}の基礎は十分理解されています。応用問題に挑戦しましょう`
        });
      }

      return recommendations.slice(0, 3); // 上位3つの推薦
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  // 学習パスの生成
  async generateLearningPath(userId: string): Promise<{
    currentStep: number;
    totalSteps: number;
    path: {
      step: number;
      topic: string;
      title: string;
      description: string;
      difficulty: string;
      estimatedTime: number; // minutes
      prerequisites: string[];
    }[];
  }> {
    try {
      const metrics = await this.calculateLearningMetrics(userId);
      const path = [];

      // 基礎固め段階
      for (const topic of metrics.strugglingTopics) {
        path.push({
          step: path.length + 1,
          topic,
          title: `${this.getTopicDisplayName(topic)}の基礎`,
          description: `${this.getTopicDisplayName(topic)}の基本概念を理解しましょう`,
          difficulty: 'beginner',
          estimatedTime: 15,
          prerequisites: []
        });
      }

      // 応用段階
      const topics = ['algebra', 'geometry', 'functions', 'probability'];
      for (const topic of topics) {
        if (!metrics.strugglingTopics.includes(topic) && !metrics.masteredTopics.includes(topic)) {
          path.push({
            step: path.length + 1,
            topic,
            title: `${this.getTopicDisplayName(topic)}の応用`,
            description: `${this.getTopicDisplayName(topic)}の応用問題に取り組みましょう`,
            difficulty: 'intermediate',
            estimatedTime: 20,
            prerequisites: metrics.strugglingTopics
          });
        }
      }

      // 発展段階
      for (const topic of metrics.masteredTopics) {
        path.push({
          step: path.length + 1,
          topic,
          title: `${this.getTopicDisplayName(topic)}の発展`,
          description: `${this.getTopicDisplayName(topic)}の高度な問題に挑戦しましょう`,
          difficulty: 'advanced',
          estimatedTime: 30,
          prerequisites: topics.filter(t => t !== topic)
        });
      }

      return {
        currentStep: 1,
        totalSteps: path.length,
        path
      };
    } catch (error) {
      logger.error('Failed to generate learning path:', error);
      throw error;
    }
  }

  // プライベートヘルパーメソッド
  private calculateSuggestedDifficulty(avgProficiency: number, currentLevel: number): number {
    if (avgProficiency >= 80) return currentLevel + 1;
    if (avgProficiency >= 60) return currentLevel;
    return Math.max(1, currentLevel - 1);
  }

  private getDifficultyForTopic(proficiency: number): 'beginner' | 'intermediate' | 'advanced' {
    if (proficiency < 30) return 'beginner';
    if (proficiency < 70) return 'intermediate';
    return 'advanced';
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