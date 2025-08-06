import { logger } from '../utils/logger';

export interface EmotionAnalysis {
  primaryEmotion: 'confused' | 'frustrated' | 'confident' | 'curious' | 'excited' | 'neutral';
  confidence: number; // 0-1
  indicators: string[];
  suggestions: {
    responseStyle: 'encouraging' | 'explanatory' | 'challenging' | 'supportive';
    toneAdjustment: 'gentler' | 'maintain' | 'more_energetic';
    contentAdjustment: 'simplify' | 'maintain' | 'increase_complexity';
  };
}

export interface LearningStateAnalysis {
  comprehensionLevel: 'struggling' | 'developing' | 'proficient' | 'advanced';
  engagementLevel: 'low' | 'medium' | 'high';
  motivationIndicators: {
    isMotivated: boolean;
    needsEncouragement: boolean;
    showingProgress: boolean;
  };
}

export class EmotionAnalysisService {
  // ユーザーの回答から感情状態を分析
  analyzeUserEmotion(userMessage: string, context: {
    previousResponses: string[];
    currentTopic: string;
    difficultyLevel: string;
  }): EmotionAnalysis {
    const message = userMessage.toLowerCase();
    
    // 感情指標キーワード
    const emotionKeywords = {
      confused: ['わからない', '分からない', '理解できない', '意味不明', 'よくわからない', '難しい', '???'],
      frustrated: ['むずかしい', 'できない', 'だめ', '無理', 'イライラ', 'もういや', '諦め'],
      confident: ['わかった', '分かった', '理解した', '簡単', 'できた', '知ってる', '余裕'],
      curious: ['なぜ', 'どうして', 'もっと', '興味深い', '面白い', '他には', '詳しく'],
      excited: ['楽しい', 'おもしろい', '面白い', 'すごい', 'やった', '嬉しい', '！！'],
      neutral: []
    };

    const emotions: (keyof typeof emotionKeywords)[] = ['confused', 'frustrated', 'confident', 'curious', 'excited'];
    const emotionScores: Record<string, number> = {};

    // キーワードマッチングによる感情スコア計算
    for (const emotion of emotions) {
      const keywords = emotionKeywords[emotion];
      const matches = keywords.filter(keyword => message.includes(keyword)).length;
      emotionScores[emotion] = matches;
    }

    // 文章の長さと複雑さの分析
    const messageLength = userMessage.length;
    const hasQuestionMarks = (userMessage.match(/\?|？/g) || []).length;
    const hasExclamation = (userMessage.match(/!|！/g) || []).length;

    // 文脈分析
    if (messageLength < 10) {
      emotionScores.frustrated += 0.5; // 短い回答は困惑の可能性
    }

    if (hasQuestionMarks > 0) {
      emotionScores.curious += hasQuestionMarks * 0.3;
      emotionScores.confused += hasQuestionMarks * 0.2;
    }

    if (hasExclamation > 1) {
      emotionScores.excited += hasExclamation * 0.3;
    }

    // 最も高いスコアの感情を特定
    const primaryEmotion = emotions.reduce((a, b) => 
      emotionScores[a] > emotionScores[b] ? a : b
    ) || 'neutral';

    const confidence = Math.min(emotionScores[primaryEmotion] / 3, 1);

    // 指標の生成
    const indicators = this.generateEmotionIndicators(userMessage, primaryEmotion);

    // 対応提案の生成
    const suggestions = this.generateEmotionBasedSuggestions(primaryEmotion, context);

    return {
      primaryEmotion,
      confidence,
      indicators,
      suggestions
    };
  }

  // 学習状態の分析
  analyzeLearningState(
    recentMessages: string[],
    responseQuality: number[], // 0-1 scores
    timeSpentOnProblems: number[] // seconds
  ): LearningStateAnalysis {
    const avgQuality = responseQuality.reduce((a, b) => a + b, 0) / responseQuality.length || 0;
    const avgTime = timeSpentOnProblems.reduce((a, b) => a + b, 0) / timeSpentOnProblems.length || 0;

    // 理解レベルの判定
    let comprehensionLevel: LearningStateAnalysis['comprehensionLevel'];
    if (avgQuality < 0.3) {
      comprehensionLevel = 'struggling';
    } else if (avgQuality < 0.6) {
      comprehensionLevel = 'developing';
    } else if (avgQuality < 0.8) {
      comprehensionLevel = 'proficient';
    } else {
      comprehensionLevel = 'advanced';
    }

    // エンゲージメントレベルの判定
    let engagementLevel: LearningStateAnalysis['engagementLevel'];
    const recentMessageLength = recentMessages.join('').length;
    if (recentMessageLength < 50) {
      engagementLevel = 'low';
    } else if (recentMessageLength < 200) {
      engagementLevel = 'medium';
    } else {
      engagementLevel = 'high';
    }

    // モチベーション指標
    const motivationIndicators = {
      isMotivated: engagementLevel !== 'low' && avgQuality > 0.4,
      needsEncouragement: comprehensionLevel === 'struggling' || avgQuality < 0.5,
      showingProgress: responseQuality.length > 1 && 
        responseQuality[responseQuality.length - 1] > responseQuality[0]
    };

    return {
      comprehensionLevel,
      engagementLevel,
      motivationIndicators
    };
  }

  // AIの応答スタイルを感情に基づいて調整
  adjustResponseStyle(
    originalResponse: string,
    emotionAnalysis: EmotionAnalysis,
    learningState: LearningStateAnalysis
  ): string {
    const { primaryEmotion, suggestions } = emotionAnalysis;
    const { comprehensionLevel, motivationIndicators } = learningState;

    let adjustedResponse = originalResponse;

    // 感情に基づく調整
    switch (primaryEmotion) {
      case 'confused':
        adjustedResponse = this.makeResponseMoreExplanatory(adjustedResponse);
        break;
      case 'frustrated':
        adjustedResponse = this.makeResponseMoreEncouraging(adjustedResponse);
        break;
      case 'confident':
        adjustedResponse = this.makeResponseMoreChallenging(adjustedResponse);
        break;
      case 'curious':
        adjustedResponse = this.addAdditionalInformation(adjustedResponse);
        break;
      case 'excited':
        adjustedResponse = this.matchEnergyLevel(adjustedResponse);
        break;
    }

    // 理解度に基づく調整
    if (comprehensionLevel === 'struggling') {
      adjustedResponse = this.simplifyExplanation(adjustedResponse);
    } else if (comprehensionLevel === 'advanced') {
      adjustedResponse = this.addComplexity(adjustedResponse);
    }

    // モチベーションに基づる調整
    if (motivationIndicators.needsEncouragement) {
      adjustedResponse = this.addEncouragement(adjustedResponse);
    }

    if (motivationIndicators.showingProgress) {
      adjustedResponse = this.acknowledgeProgress(adjustedResponse);
    }

    return adjustedResponse;
  }

  // プライベートヘルパーメソッド
  private generateEmotionIndicators(message: string, emotion: string): string[] {
    const indicators: string[] = [];
    
    switch (emotion) {
      case 'confused':
        indicators.push('質問が多い', '不確実な表現');
        break;
      case 'frustrated':
        indicators.push('短い回答', '否定的な語彙');
        break;
      case 'confident':
        indicators.push('断定的な回答', '詳細な説明');
        break;
      case 'curious':
        indicators.push('疑問詞の使用', '追加質問');
        break;
      case 'excited':
        indicators.push('感嘆符の多用', 'ポジティブな語彙');
        break;
    }

    return indicators;
  }

  private generateEmotionBasedSuggestions(emotion: string, context: any): EmotionAnalysis['suggestions'] {
    const baseStyle: EmotionAnalysis['suggestions'] = {
      responseStyle: 'supportive',
      toneAdjustment: 'maintain',
      contentAdjustment: 'maintain'
    };

    switch (emotion) {
      case 'confused':
        return {
          responseStyle: 'explanatory',
          toneAdjustment: 'gentler',
          contentAdjustment: 'simplify'
        };
      case 'frustrated':
        return {
          responseStyle: 'encouraging',
          toneAdjustment: 'gentler',
          contentAdjustment: 'simplify'
        };
      case 'confident':
        return {
          responseStyle: 'challenging',
          toneAdjustment: 'maintain',
          contentAdjustment: 'increase_complexity'
        };
      case 'curious':
        return {
          responseStyle: 'explanatory',
          toneAdjustment: 'more_energetic',
          contentAdjustment: 'maintain'
        };
      case 'excited':
        return {
          responseStyle: 'encouraging',
          toneAdjustment: 'more_energetic',
          contentAdjustment: 'maintain'
        };
      default:
        return baseStyle;
    }
  }

  private makeResponseMoreExplanatory(response: string): string {
    return `${response}\n\n💡 詳しく説明すると、これは段階的に考えることができます。まず...`;
  }

  private makeResponseMoreEncouraging(response: string): string {
    return `大丈夫だよ！😊 ${response}\n\n✨ 一歩ずつ進んでいけば必ずできるようになるから、焦らないでね！`;
  }

  private makeResponseMoreChallenging(response: string): string {
    return `${response}\n\n🚀 よくできました！もう一歩進んで、こんな問題はどうでしょう？`;
  }

  private addAdditionalInformation(response: string): string {
    return `${response}\n\n🤔 ちなみに、これに関連して面白いことがあるんです...`;
  }

  private matchEnergyLevel(response: string): string {
    return `${response} 🎉\n\nその調子！とっても良い感じです！！`;
  }

  private simplifyExplanation(response: string): string {
    return response.replace(/複雑な|難しい|高度な/g, '基本的な')
      .replace(/詳細に|詳しく/g, 'わかりやすく');
  }

  private addComplexity(response: string): string {
    return `${response}\n\n🎯 もう少し発展的に考えてみると...`;
  }

  private addEncouragement(response: string): string {
    return `${response}\n\n💪 頑張っていますね！継続は力なりです！`;
  }

  private acknowledgeProgress(response: string): string {
    return `${response}\n\n📈 前回より理解が深まっていますね！素晴らしい成長です！`;
  }
}