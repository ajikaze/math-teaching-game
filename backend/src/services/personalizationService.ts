import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AdaptiveLearningService } from './adaptiveLearningService';
import { EmotionAnalysisService } from './emotionAnalysisService';

const prisma = new PrismaClient();

export interface UserPersonalityProfile {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pace: 'slow' | 'moderate' | 'fast';
  preferredDifficulty: 'easy' | 'moderate' | 'challenging';
  motivationFactors: string[];
  interactionPreferences: {
    formalityLevel: 'formal' | 'casual' | 'friendly';
    explanationStyle: 'brief' | 'detailed' | 'step_by_step';
    feedbackType: 'immediate' | 'summary' | 'minimal';
  };
  characterRelationship: {
    trustLevel: number; // 0-100
    preferredMood: string;
    communicationHistory: number; // interaction count
  };
}

export interface PersonalizedContent {
  question: {
    text: string;
    difficulty: string;
    style: string;
    hints: string[];
  };
  response: {
    text: string;
    tone: string;
    additionalResources: string[];
  };
  characterBehavior: {
    mood: string;
    expressions: string[];
    encouragementLevel: number;
  };
}

export class PersonalizationService {
  private adaptiveLearning: AdaptiveLearningService;
  private emotionAnalysis: EmotionAnalysisService;

  constructor() {
    this.adaptiveLearning = new AdaptiveLearningService();
    this.emotionAnalysis = new EmotionAnalysisService();
  }

  // ユーザーの個人プロファイル分析
  async analyzeUserPersonality(userId: string): Promise<UserPersonalityProfile> {
    try {
      const [conversations, characterState, metrics] = await Promise.all([
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 50
        }),
        prisma.characterState.findUnique({ where: { userId } }),
        this.adaptiveLearning.calculateLearningMetrics(userId)
      ]);

      if (!characterState) {
        throw new Error('Character state not found');
      }

      // 学習スタイルの推定
      const learningStyle = this.inferLearningStyle(conversations);
      
      // ペースの分析
      const pace = this.analyzeLearningPace(metrics.learningVelocity, characterState.totalProblems);
      
      // 難易度好みの分析
      const preferredDifficulty = this.analyzePreferredDifficulty(
        metrics.topicProficiency,
        characterState.level
      );

      // モチベーション要因の分析
      const motivationFactors = this.identifyMotivationFactors(conversations);

      // 交流の好みを分析
      const interactionPreferences = this.analyzeInteractionPreferences(conversations);

      // キャラクターとの関係性分析
      const characterRelationship = this.analyzeCharacterRelationship(
        conversations,
        characterState
      );

      return {
        userId,
        learningStyle,
        pace,
        preferredDifficulty,
        motivationFactors,
        interactionPreferences,
        characterRelationship
      };
    } catch (error) {
      logger.error('Failed to analyze user personality:', error);
      throw error;
    }
  }

  // パーソナライズされたコンテンツ生成
  async generatePersonalizedContent(
    userId: string,
    topic: string,
    requestType: 'question' | 'answer',
    context: {
      previousMessage?: string;
      currentDifficulty?: string;
    }
  ): Promise<PersonalizedContent> {
    try {
      const [profile, recommendations] = await Promise.all([
        this.analyzeUserPersonality(userId),
        this.adaptiveLearning.generateRecommendations(userId)
      ]);

      let content: PersonalizedContent;

      if (requestType === 'question') {
        content = await this.generatePersonalizedQuestion(profile, topic, recommendations[0]);
      } else {
        content = await this.generatePersonalizedResponse(
          profile,
          context.previousMessage || '',
          topic
        );
      }

      return content;
    } catch (error) {
      logger.error('Failed to generate personalized content:', error);
      throw error;
    }
  }

  // キャラクターの行動をパーソナライズ
  async personalizeCharacterBehavior(
    userId: string,
    userMessage: string,
    context: {
      topic: string;
      sessionLength: number;
      recentPerformance: number;
    }
  ): Promise<{
    mood: string;
    responseStyle: string;
    encouragementLevel: number;
    personalizedGreeting?: string;
  }> {
    try {
      const profile = await this.analyzeUserPersonality(userId);
      const emotionAnalysis = this.emotionAnalysis.analyzeUserEmotion(
        userMessage,
        {
          previousResponses: [],
          currentTopic: context.topic,
          difficultyLevel: profile.preferredDifficulty
        }
      );

      // 関係性に基づいてキャラクターの行動を調整
      let mood = 'curious';
      let responseStyle = 'supportive';
      let encouragementLevel = 0.5;

      // 信頼レベルに基づく調整
      if (profile.characterRelationship.trustLevel > 70) {
        mood = 'happy';
        responseStyle = 'friendly';
        encouragementLevel = 0.7;
      } else if (profile.characterRelationship.trustLevel < 30) {
        mood = 'curious';
        responseStyle = 'gentle';
        encouragementLevel = 0.8;
      }

      // 感情状態に基づく調整
      if (emotionAnalysis.primaryEmotion === 'frustrated') {
        mood = 'supportive';
        responseStyle = 'encouraging';
        encouragementLevel = 0.9;
      } else if (emotionAnalysis.primaryEmotion === 'excited') {
        mood = 'excited';
        responseStyle = 'energetic';
        encouragementLevel = 0.6;
      }

      // パフォーマンスに基づく調整
      if (context.recentPerformance > 0.8) {
        mood = 'proud';
        responseStyle = 'congratulatory';
        encouragementLevel = 0.3;
      } else if (context.recentPerformance < 0.4) {
        mood = 'supportive';
        responseStyle = 'patient';
        encouragementLevel = 0.9;
      }

      // 個別化された挨拶
      let personalizedGreeting;
      if (profile.characterRelationship.communicationHistory > 20) {
        personalizedGreeting = `${this.getUserNickname(userId)}、今日も一緒に数学を頑張ろう！`;
      }

      return {
        mood,
        responseStyle,
        encouragementLevel,
        personalizedGreeting
      };
    } catch (error) {
      logger.error('Failed to personalize character behavior:', error);
      return {
        mood: 'curious',
        responseStyle: 'supportive',
        encouragementLevel: 0.5
      };
    }
  }

  // プライベートヘルパーメソッド
  private inferLearningStyle(conversations: any[]): UserPersonalityProfile['learningStyle'] {
    const textAnalysis = conversations.map(c => c.content).join(' ');
    
    // 視覚的キーワード
    const visualKeywords = ['図', '表', 'グラフ', '見る', '画像', '色'];
    const visualScore = visualKeywords.reduce((score, keyword) => 
      score + (textAnalysis.includes(keyword) ? 1 : 0), 0
    );

    // 聴覚的キーワード  
    const auditoryKeywords = ['聞く', '説明', '話', '音'];
    const auditoryScore = auditoryKeywords.reduce((score, keyword) => 
      score + (textAnalysis.includes(keyword) ? 1 : 0), 0
    );

    // 体感的キーワード
    const kinestheticKeywords = ['やってみる', '実践', '手', '体験'];
    const kinestheticScore = kinestheticKeywords.reduce((score, keyword) => 
      score + (textAnalysis.includes(keyword) ? 1 : 0), 0
    );

    // 読み書きキーワード
    const readingKeywords = ['書く', '読む', 'メモ', '文字'];
    const readingScore = readingKeywords.reduce((score, keyword) => 
      score + (textAnalysis.includes(keyword) ? 1 : 0), 0
    );

    const scores = { visual: visualScore, auditory: auditoryScore, kinesthetic: kinestheticScore, reading: readingScore };
    const maxScore = Math.max(...Object.values(scores));
    
    return Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as UserPersonalityProfile['learningStyle'] || 'visual';
  }

  private analyzeLearningPace(velocity: number, totalProblems: number): UserPersonalityProfile['pace'] {
    if (velocity < 2) return 'slow';
    if (velocity < 5) return 'moderate';
    return 'fast';
  }

  private analyzePreferredDifficulty(proficiency: any, level: number): UserPersonalityProfile['preferredDifficulty'] {
    const avgProficiency = Object.values(proficiency).reduce((a: any, b: any) => a + b, 0) / 4;
    
    if (avgProficiency < 40) return 'easy';
    if (avgProficiency < 70) return 'moderate';
    return 'challenging';
  }

  private identifyMotivationFactors(conversations: any[]): string[] {
    const factors = [];
    const textAnalysis = conversations.map(c => c.content).join(' ');
    
    if (textAnalysis.includes('楽しい') || textAnalysis.includes('面白い')) {
      factors.push('fun_learning');
    }
    if (textAnalysis.includes('目標') || textAnalysis.includes('できるように')) {
      factors.push('achievement');
    }
    if (textAnalysis.includes('褒め') || textAnalysis.includes('認め')) {
      factors.push('recognition');
    }
    
    return factors.length > 0 ? factors : ['achievement'];
  }

  private analyzeInteractionPreferences(conversations: any[]): UserPersonalityProfile['interactionPreferences'] {
    const avgMessageLength = conversations.reduce((sum, c) => sum + c.content.length, 0) / conversations.length || 0;
    
    return {
      formalityLevel: 'friendly', // デフォルト
      explanationStyle: avgMessageLength > 100 ? 'detailed' : 'brief',
      feedbackType: 'immediate'
    };
  }

  private analyzeCharacterRelationship(conversations: any[], characterState: any): UserPersonalityProfile['characterRelationship'] {
    return {
      trustLevel: Math.min(conversations.length * 2, 100), // 会話回数に基づく
      preferredMood: characterState.mood,
      communicationHistory: conversations.length
    };
  }

  private async generatePersonalizedQuestion(
    profile: UserPersonalityProfile,
    topic: string,
    recommendation: any
  ): Promise<PersonalizedContent> {
    const baseQuestion = `${topic}について質問があります`;
    
    // プロファイルに基づいてカスタマイズ
    let questionText = baseQuestion;
    let style = 'standard';
    let hints: string[] = [];

    switch (profile.learningStyle) {
      case 'visual':
        style = 'visual_focused';
        hints.push('図やグラフで考えてみてください');
        break;
      case 'auditory':
        style = 'explanation_focused';
        hints.push('声に出して説明してみてください');
        break;
      case 'kinesthetic':
        style = 'practice_focused';  
        hints.push('実際に計算してみましょう');
        break;
      case 'reading':
        style = 'text_focused';
        hints.push('ステップごとに書き出してみてください');
        break;
    }

    return {
      question: {
        text: questionText,
        difficulty: profile.preferredDifficulty,
        style,
        hints
      },
      response: {
        text: '',
        tone: profile.interactionPreferences.formalityLevel,
        additionalResources: []
      },
      characterBehavior: {
        mood: profile.characterRelationship.preferredMood,
        expressions: ['curious', 'encouraging'],
        encouragementLevel: profile.characterRelationship.trustLevel / 100
      }
    };
  }

  private async generatePersonalizedResponse(
    profile: UserPersonalityProfile,
    userMessage: string,
    topic: string
  ): Promise<PersonalizedContent> {
    const baseResponse = 'よく頑張りましたね！';
    
    let responseText = baseResponse;
    let tone = profile.interactionPreferences.formalityLevel;
    let additionalResources: string[] = [];

    // 学習スタイルに基づくリソース追加
    switch (profile.learningStyle) {
      case 'visual':
        additionalResources.push('関連する図解を確認してみてください');
        break;
      case 'auditory':
        additionalResources.push('音声での解説も利用できます');
        break;
    }

    return {
      question: {
        text: '',
        difficulty: '',
        style: '',
        hints: []
      },
      response: {
        text: responseText,
        tone,
        additionalResources
      },
      characterBehavior: {
        mood: 'happy',
        expressions: ['proud', 'encouraging'],
        encouragementLevel: 0.7
      }
    };
  }

  private getUserNickname(userId: string): string {
    // 実際の実装では、ユーザーのプリファレンスから取得
    return 'あなた'; // プレースホルダー
  }
}