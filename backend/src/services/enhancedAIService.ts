import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { AdaptiveLearningService } from './adaptiveLearningService';
import { EmotionAnalysisService } from './emotionAnalysisService';
import { PersonalizationService } from './personalizationService';

export interface EnhancedAIRequest {
  userId: string;
  message?: string;
  currentTopic: string;
  requestType: 'question' | 'answer';
  conversationHistory: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  characterState: {
    level: number;
    experience: number;
    understanding: {
      algebra: number;
      geometry: number;
      functions: number;
      probability: number;
    };
    mood: string;
    totalProblems: number;
  };
}

export interface EnhancedAIResponse {
  response: string;
  expGain: number;
  mood: string;
  timestamp: string;
  metadata: {
    difficulty: string;
    emotionAnalysis?: any;
    personalization?: any;
    adaptiveRecommendations?: any;
    confidenceScore: number;
  };
}

export class EnhancedAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private adaptiveLearning: AdaptiveLearningService;
  private emotionAnalysis: EmotionAnalysisService;
  private personalization: PersonalizationService;

  constructor() {
    this.adaptiveLearning = new AdaptiveLearningService();
    this.emotionAnalysis = new EmotionAnalysisService();
    this.personalization = new PersonalizationService();
    this.initializeAI();
  }

  private initializeAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.warn('GEMINI_API_KEY is not set - Enhanced AI features will use fallback');
        return;
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
      logger.info('Enhanced AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Enhanced AI service:', error);
    }
  }

  async processRequest(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    try {
      const startTime = Date.now();

      // 並列でユーザー分析を実行
      const [metrics, personality, recommendations] = await Promise.all([
        this.adaptiveLearning.calculateLearningMetrics(request.userId),
        this.personalization.analyzeUserPersonality(request.userId),
        this.adaptiveLearning.generateRecommendations(request.userId)
      ]);

      // 感情分析（ユーザーメッセージがある場合）
      let emotionAnalysis;
      if (request.message && request.requestType === 'answer') {
        emotionAnalysis = this.emotionAnalysis.analyzeUserEmotion(
          request.message,
          {
            previousResponses: request.conversationHistory
              .filter(h => h.role === 'user')
              .map(h => h.content),
            currentTopic: request.currentTopic,
            difficultyLevel: personality.preferredDifficulty
          }
        );
      }

      // パーソナライズされたコンテンツ生成
      const personalizedContent = await this.personalization.generatePersonalizedContent(
        request.userId,
        request.currentTopic,
        request.requestType,
        {
          previousMessage: request.message,
          currentDifficulty: recommendations[0]?.difficultyLevel
        }
      );

      // AIプロンプトの構築
      const enhancedPrompt = this.buildEnhancedPrompt(
        request,
        metrics,
        personality,
        recommendations[0],
        emotionAnalysis,
        personalizedContent
      );

      // AI応答の生成
      let aiResponse: string;
      let confidenceScore = 0.8;

      if (this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
          });
          
          const result = await model.generateContent(enhancedPrompt);
          const response = await result.response;
          aiResponse = response.text();
          confidenceScore = 0.9;
        } catch (error) {
          logger.error('AI generation failed, using fallback:', error);
          aiResponse = this.generateFallbackResponse(request, personalizedContent);
          confidenceScore = 0.6;
        }
      } else {
        aiResponse = this.generateFallbackResponse(request, personalizedContent);
        confidenceScore = 0.5;
      }

      // 感情に基づく応答調整
      if (emotionAnalysis) {
        const recentMessages = request.conversationHistory
          .slice(-5)
          .map(h => h.content);
        
        const learningState = this.emotionAnalysis.analyzeLearningState(
          recentMessages,
          [0.7, 0.8, 0.6], // Mock response quality scores
          [30, 45, 25] // Mock time spent
        );

        aiResponse = this.emotionAnalysis.adjustResponseStyle(
          aiResponse,
          emotionAnalysis,
          learningState
        );
      }

      // キャラクター行動のパーソナライゼーション
      const characterBehavior = await this.personalization.personalizeCharacterBehavior(
        request.userId,
        request.message || '',
        {
          topic: request.currentTopic,
          sessionLength: request.conversationHistory.length,
          recentPerformance: 0.7 // Mock performance score
        }
      );

      // 経験値とムードの計算
      const expGain = this.calculateExperienceGain(
        request.requestType,
        metrics,
        emotionAnalysis,
        confidenceScore
      );

      const mood = characterBehavior.mood || 'curious';

      // レスポンス時間をログ
      const processingTime = Date.now() - startTime;
      logger.info(`Enhanced AI processing completed in ${processingTime}ms`);

      return {
        response: aiResponse,
        expGain,
        mood,
        timestamp: new Date().toISOString(),
        metadata: {
          difficulty: recommendations[0]?.difficultyLevel || 'intermediate',
          emotionAnalysis,
          personalization: {
            learningStyle: personality.learningStyle,
            characterRelationship: characterBehavior
          },
          adaptiveRecommendations: recommendations,
          confidenceScore
        }
      };

    } catch (error) {
      logger.error('Enhanced AI processing failed:', error);
      return this.generateErrorResponse(request);
    }
  }

  private buildEnhancedPrompt(
    request: EnhancedAIRequest,
    metrics: any,
    personality: any,
    recommendation: any,
    emotionAnalysis: any,
    personalizedContent: any
  ): string {
    const basePrompt = `
あなたは数学学習AIアシスタント「マナ」です。以下のユーザー情報を参考にして、個別最適化された応答をしてください。

## ユーザー分析
- 学習レベル: ${metrics.difficultyProgression.currentLevel}
- 総問題数: ${metrics.totalProblems}
- 学習スタイル: ${personality.learningStyle}
- 学習ペース: ${personality.pace}
- 苦手分野: ${metrics.strugglingTopics.join(', ') || 'なし'}
- 得意分野: ${metrics.masteredTopics.join(', ') || 'なし'}

## 推薦設定
- 推薦トピック: ${recommendation?.recommendedTopic || request.currentTopic}
- 難易度: ${recommendation?.difficultyLevel || 'intermediate'}
- フォーカス: ${recommendation?.reasoning || ''}

## 現在のコンテキスト
- 現在のトピック: ${request.currentTopic}
- リクエストタイプ: ${request.requestType}
- キャラクターのムード: ${request.characterState.mood}
`;

    if (emotionAnalysis) {
      return basePrompt + `
## 感情分析
- 主要感情: ${emotionAnalysis.primaryEmotion}
- 信頼度: ${emotionAnalysis.confidence}
- 推奨対応: ${emotionAnalysis.suggestions.responseStyle}

この情報を元に、ユーザーの感情状態に配慮した応答をしてください。
`;
    }

    if (request.requestType === 'question') {
      return basePrompt + `
個別最適化された数学の質問を生成してください。ユーザーの学習レベルと苦手分野を考慮し、適切な難易度で興味を引く問題を作成してください。
`;
    } else {
      return basePrompt + `
ユーザーの回答: "${request.message}"

この回答に対して、個別化されたフィードバックを提供してください。学習スタイルと感情状態を考慮し、建設的で励ましの言葉を含めてください。
`;
    }
  }

  private generateFallbackResponse(
    request: EnhancedAIRequest,
    personalizedContent: any
  ): string {
    if (request.requestType === 'question') {
      const topics = {
        algebra: '代数の基本的な方程式について一緒に考えてみましょう！',
        geometry: '図形の性質について学んでみましょう！',
        functions: '関数の基本について理解を深めましょう！',
        probability: '確率の考え方を身につけましょう！'
      };
      
      return topics[request.currentTopic as keyof typeof topics] || 
             '今日は何を学習しますか？😊';
    } else {
      const encouragements = [
        'よく考えましたね！👏',
        'その調子で頑張りましょう！✨',
        '理解が深まってきていますね！📚',
        '素晴らしい取り組みです！🌟'
      ];
      
      return encouragements[Math.floor(Math.random() * encouragements.length)];
    }
  }

  private calculateExperienceGain(
    requestType: string,
    metrics: any,
    emotionAnalysis: any,
    confidenceScore: number
  ): number {
    let baseExp = requestType === 'question' ? 5 : 15;
    
    // 感情状態による調整
    if (emotionAnalysis) {
      switch (emotionAnalysis.primaryEmotion) {
        case 'confused':
          baseExp *= 0.7; // 困惑時は少なめ
          break;
        case 'excited':
          baseExp *= 1.3; // 興奮時は多め
          break;
        case 'confident':
          baseExp *= 1.1;
          break;
      }
    }

    // 信頼度による調整
    baseExp *= confidenceScore;

    // 学習進捗による調整
    if (metrics.learningVelocity > 5) {
      baseExp *= 1.1; // 活発な学習者にはボーナス
    }

    return Math.round(Math.max(1, baseExp));
  }

  private generateErrorResponse(request: EnhancedAIRequest): EnhancedAIResponse {
    return {
      response: 'すみません、今は少し調子が悪いようです...😅 後でもう一度試してもらえますか？',
      expGain: 1,
      mood: 'confused',
      timestamp: new Date().toISOString(),
      metadata: {
        difficulty: 'intermediate',
        confidenceScore: 0.1
      }
    };
  }
}