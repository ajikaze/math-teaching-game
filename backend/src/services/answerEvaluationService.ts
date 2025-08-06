// backend/src/services/answerEvaluationService.ts
import { CharacterState, ConversationMessage } from "../types";
import { logger } from "../utils/logger";
import { GeminiService } from "./geminiService";

interface EvaluationParams {
    userAnswer: string;
    topic: string;
    characterState: CharacterState;
    conversationHistory: ConversationMessage[];
}

interface EvaluationResult {
    response: string;
    experienceGain: number;
    newMood: CharacterState["mood"];
    understandingImprovement: number;
}

export class AnswerEvaluationService {
    private geminiService: GeminiService | null = null;
    private fallbackEnabled: boolean = true;

    constructor() {
        try {
            this.geminiService = new GeminiService();
            logger.info("AnswerEvaluationService initialized with Gemini AI");
        } catch (error) {
            logger.warn(
                "Gemini AI not available, falling back to rule-based evaluation:",
                error
            );
            this.fallbackEnabled = true;
        }
    }

    public async evaluateAnswer(
        params: EvaluationParams
    ): Promise<EvaluationResult> {
        try {
            // Gemini AIを試行
            if (this.geminiService) {
                const aiEvaluation = await this.geminiService.evaluateAnswer(
                    params.userAnswer,
                    params.topic,
                    params.characterState,
                    params.conversationHistory
                );

                const experienceGain = this.calculateExperienceGain(
                    aiEvaluation.quality,
                    params.userAnswer.length
                );
                const understandingImprovement =
                    this.calculateUnderstandingImprovement(
                        aiEvaluation.quality
                    );

                logger.info(`AI evaluation completed for ${params.topic}:`, {
                    quality: aiEvaluation.quality,
                    mood: aiEvaluation.mood,
                });

                return {
                    response: aiEvaluation.response,
                    experienceGain,
                    newMood: aiEvaluation.mood,
                    understandingImprovement,
                };
            }
        } catch (error) {
            logger.error("Gemini AI evaluation failed, using fallback:", error);
        }

        // フォールバック：ルールベース評価
        if (this.fallbackEnabled) {
            return this.evaluateWithFallback(params);
        }

        throw new Error("Answer evaluation service unavailable");
    }

    // フォールバック用ルールベース評価
    private evaluateWithFallback(params: EvaluationParams): EvaluationResult {
        const { userAnswer, topic, characterState } = params;

        logger.info(`Using fallback evaluation for ${topic}`);

        // 回答の品質を評価
        const quality = this.assessAnswerQuality(userAnswer, topic);

        // 経験値を計算
        const experienceGain = this.calculateExperienceGain(
            quality,
            userAnswer.length
        );

        // 理解度向上を計算
        const understandingImprovement =
            this.calculateUnderstandingImprovement(quality);

        // 新しい気分を決定
        const newMood = this.determineNewMood(quality, characterState.mood);

        // 応答を生成
        const response = this.generateResponse(quality, topic, userAnswer);

        return {
            response,
            experienceGain,
            newMood,
            understandingImprovement,
        };
    }

    private assessAnswerQuality(
        answer: string,
        topic: string
    ): "excellent" | "good" | "average" | "poor" {
        const wordCount = answer.trim().split(/\s+/).length;
        const hasKeywords = this.hasTopicKeywords(answer, topic);
        const hasExamples = this.hasExamples(answer);
        const hasSteps = this.hasStepByStep(answer);

        let score = 0;

        // 長さによる評価
        if (wordCount > 50) score += 2;
        else if (wordCount > 20) score += 1;

        // キーワードの有無
        if (hasKeywords) score += 2;

        // 具体例の有無
        if (hasExamples) score += 1;

        // 段階的説明の有無
        if (hasSteps) score += 1;

        // 丁寧さ（敬語や説明の工夫）
        if (this.isPoliteAndClear(answer)) score += 1;

        if (score >= 6) return "excellent";
        if (score >= 4) return "good";
        if (score >= 2) return "average";
        return "poor";
    }

    private hasTopicKeywords(answer: string, topic: string): boolean {
        const keywords = {
            algebra: [
                "方程式",
                "解",
                "変数",
                "文字",
                "係数",
                "項",
                "因数分解",
                "展開",
            ],
            geometry: [
                "図形",
                "面積",
                "角度",
                "直線",
                "円",
                "三角形",
                "四角形",
                "体積",
            ],
            functions: [
                "関数",
                "グラフ",
                "座標",
                "傾き",
                "切片",
                "変化",
                "比例",
                "反比例",
            ],
            probability: [
                "確率",
                "場合の数",
                "順列",
                "組合せ",
                "事象",
                "標本空間",
            ],
        };

        const topicKeywords = keywords[topic as keyof typeof keywords] || [];
        return topicKeywords.some((keyword) => answer.includes(keyword));
    }

    private hasExamples(answer: string): boolean {
        const exampleIndicators = [
            "例えば",
            "たとえば",
            "具体的に",
            "実際に",
            "つまり",
            "だから",
        ];
        return exampleIndicators.some((indicator) =>
            answer.includes(indicator)
        );
    }

    private hasStepByStep(answer: string): boolean {
        const stepIndicators = [
            "まず",
            "次に",
            "最後に",
            "①",
            "②",
            "③",
            "1.",
            "2.",
            "3.",
            "手順",
        ];
        return stepIndicators.some((indicator) => answer.includes(indicator));
    }

    private isPoliteAndClear(answer: string): boolean {
        const politeIndicators = [
            "です",
            "である",
            "ます",
            "だと思います",
            "と考えます",
        ];
        const clarityIndicators = [
            "つまり",
            "すなわち",
            "というのは",
            "ということは",
        ];

        return (
            politeIndicators.some((indicator) => answer.includes(indicator)) ||
            clarityIndicators.some((indicator) => answer.includes(indicator))
        );
    }

    private calculateExperienceGain(
        quality: string,
        answerLength: number
    ): number {
        const baseExp = {
            excellent: 25,
            good: 15,
            average: 8,
            poor: 3,
        };

        let exp = baseExp[quality as keyof typeof baseExp];

        // 長い回答にはボーナス
        if (answerLength > 100) exp += 5;
        else if (answerLength > 50) exp += 2;

        return Math.min(exp, 30); // 最大30exp
    }

    private calculateUnderstandingImprovement(quality: string): number {
        const improvements = {
            excellent: 8,
            good: 5,
            average: 3,
            poor: 1,
        };

        return improvements[quality as keyof typeof improvements];
    }

    private determineNewMood(
        quality: string,
        currentMood: CharacterState["mood"]
    ): CharacterState["mood"] {
        const moodMap = {
            excellent: "excited",
            good: "happy",
            average: "curious",
            poor: "confused",
        };

        return moodMap[
            quality as keyof typeof moodMap
        ] as CharacterState["mood"];
    }

    private generateResponse(
        quality: string,
        topic: string,
        answer: string
    ): string {
        let responses: string[];

        switch (quality) {
            case "excellent":
                responses = this.positiveResponses;
                break;
            case "good":
                responses = this.positiveResponses;
                break;
            case "average":
                responses = this.encouragingResponses;
                break;
            case "poor":
                responses = this.confusedResponses;
                break;
            default:
                responses = this.encouragingResponses;
        }

        const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];

        // 特定のトピックに関する追加コメントを付加
        const topicComment = this.getTopicSpecificComment(topic, quality);

        return topicComment
            ? `${randomResponse} ${topicComment}`
            : randomResponse;
    }

    private getTopicSpecificComment(topic: string, quality: string): string {
        if (quality === "poor") return "";

        const comments = {
            algebra: [
                "代数の考え方がよく分かったよ！",
                "方程式の解き方のコツが掴めた気がする！",
                "文字式の意味がクリアになったね！",
            ],
            geometry: [
                "図形の性質について理解が深まったよ！",
                "空間的な想像力が鍛えられた感じ！",
                "幾何学って面白いんだね！",
            ],
            functions: [
                "関数のグラフがイメージできるようになった！",
                "数式と図形の関係が見えてきたよ！",
                "変化の様子がよく分かったね！",
            ],
            probability: [
                "確率の考え方が整理できた！",
                "場合の数を数える方法が分かったよ！",
                "統計的な思考が身についた感じ！",
            ],
        };

        const topicComments = comments[topic as keyof typeof comments];
        if (!topicComments) return "";

        return topicComments[Math.floor(Math.random() * topicComments.length)];
    }

    private positiveResponses = [
        "すごい！とても分かりやすい説明だったよ！😊 ありがとう！",
        "なるほど〜！そういう考え方もあるんだね！✨ 勉強になった！",
        "わあ！詳しく教えてくれてありがとう！🤩 よく理解できたよ！",
        "その説明、とても上手だね！😄 もっと教えて欲しいな！",
        "ありがとう！君の説明のおかげでよく分かったよ！🌟",
    ];

    private encouragingResponses = [
        "うんうん、いい感じだね！😊 もう少し詳しく教えてもらえる？",
        "なるほど！でも、ここの部分をもう少し説明してもらえるかな？🤔",
        "いいところに気づいたね！👍 具体例があるともっと分かりやすいかも！",
        "そうそう！その調子だよ！😄 続きも聞かせて！",
        "おお、そこは大事なポイントだね！💡 もう少し深く教えて！",
    ];

    private confusedResponses = [
        "うーん、ちょっと難しくて分からないかも...😅 もう少し簡単に説明してもらえる？",
        "ごめん、ここの部分がよく理解できないな...🤔 別の言い方で教えてくれる？",
        "あれ？ちょっと混乱しちゃった...😵‍💫 もう一度ゆっくり説明してもらえる？",
        "うーん、なんだか難しいね...😓 基本的なところから教えてもらえるかな？",
        "ちょっと待って！頭がこんがらがっちゃった...🌀 整理して教えて！",
    ];

    // 接続テスト用
    public async testAIConnection(): Promise<boolean> {
        if (!this.geminiService) return false;
        return await this.geminiService.testConnection();
    }
}
