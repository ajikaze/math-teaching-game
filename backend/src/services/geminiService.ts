// backend/src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";
import { CharacterState, ConversationMessage } from "../types";

interface GeminiConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxOutputTokens: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private config: GeminiConfig;

    constructor() {
        this.config = {
            apiKey: process.env.GEMINI_API_KEY || "",
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash", // デフォルトを更新
            temperature: 0.7,
            maxOutputTokens: 1000,
        };

        if (!this.config.apiKey) {
            logger.warn(
                "GEMINI_API_KEY is not set - GeminiService will not be available"
            );
            throw new Error("GEMINI_API_KEY is required");
        }

        if (this.config.apiKey === "your_gemini_api_key_here") {
            logger.warn("GEMINI_API_KEY is still using placeholder value");
            throw new Error("GEMINI_API_KEY is not properly configured");
        }

        try {
            this.genAI = new GoogleGenerativeAI(this.config.apiKey);

            // 複数のモデルを試行
            const modelsToTry = [
                this.config.model,
                "gemini-1.5-flash",
                "gemini-1.5-pro",
            ];
            let modelInitialized = false;

            for (const modelName of modelsToTry) {
                try {
                    this.model = this.genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: this.config.temperature,
                            maxOutputTokens: this.config.maxOutputTokens,
                        },
                    });

                    this.config.model = modelName; // 成功したモデル名を保存
                    modelInitialized = true;
                    logger.info(
                        `Gemini AI service initialized successfully with model: ${modelName}`
                    );
                    break;
                } catch (modelError) {
                    logger.debug(
                        `Failed to initialize model ${modelName}:`,
                        modelError
                    );
                    continue;
                }
            }

            if (!modelInitialized) {
                throw new Error("No working Gemini model found");
            }
        } catch (error) {
            logger.error("Failed to initialize Gemini AI service:", error);
            throw error;
        }
    }

    // 質問生成用のプロンプト作成
    private createQuestionPrompt(
        topic: string,
        characterState: CharacterState,
        conversationHistory: ConversationMessage[]
    ): string {
        const difficulty = this.getDifficultyLevel(
            characterState.understanding[
                topic as keyof typeof characterState.understanding
            ]
        );
        const recentHistory = conversationHistory
            .slice(-6)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n");

        return `
あなたは「マナ」という名前の中学生の女の子のAIキャラクターです。数学を学習している相手に質問をします。

## キャラクター設定
- 名前: マナ
- 性格: 好奇心旺盛、素直、時々困惑する、学習意欲が高い
- 口調: 親しみやすく、丁寧語を使う。絵文字を効果的に使用
- 特徴: 相手の説明を理解しようと一生懸命で、時には混乱することもある

## 現在の状況
- 学習分野: ${this.getTopicName(topic)}
- マナのレベル: ${characterState.level}
- この分野の理解度: ${
            characterState.understanding[
                topic as keyof typeof characterState.understanding
            ]
        }%
- 難易度: ${difficulty}
- 気分: ${this.getMoodDescription(characterState.mood)}

## 最近の会話履歴
${recentHistory || "まだ会話が始まったばかりです"}

## 指示
${this.getTopicName(
    topic
)}に関する${difficulty}レベルの質問を1つ作成してください。

### 質問作成のガイドライン
1. マナの現在の理解度(${
            characterState.understanding[
                topic as keyof typeof characterState.understanding
            ]
        }%)に適した難易度
2. 会話履歴と重複しない新しい角度の質問
3. 具体的で分かりやすい質問
4. 相手が説明しやすい形式
5. マナらしい親しみやすい口調と適度な絵文字使用

質問のみを出力してください。余計な説明は不要です。
`;
    }

    // 回答評価用のプロンプト作成
    private createEvaluationPrompt(
        userAnswer: string,
        topic: string,
        characterState: CharacterState,
        conversationHistory: ConversationMessage[]
    ): string {
        const lastQuestion =
            conversationHistory
                .filter((msg) => msg.role === "マナ")
                .slice(-1)[0]?.content || "";

        return `
あなたは「マナ」という名前の中学生の女の子のAIキャラクターです。相手の数学の説明を聞いて反応します。

## キャラクター設定
- 名前: マナ
- 性格: 好奇心旺盛、素直、感謝の気持ちを表現する、時々困惑する
- 口調: 親しみやすく、丁寧語を使う。絵文字を効果的に使用
- 学習スタイル: 相手の説明から学び、理解度に応じて反応が変わる

## 現在の状況
- 学習分野: ${this.getTopicName(topic)}
- マナのレベル: ${characterState.level}
- この分野の理解度: ${
            characterState.understanding[
                topic as keyof typeof characterState.understanding
            ]
        }%
- 現在の気分: ${this.getMoodDescription(characterState.mood)}

## マナが最後にした質問
${lastQuestion}

## 相手の説明
${userAnswer}

## 指示
相手の説明に対してマナとして反応してください。

### 評価基準
1. 説明の分かりやすさ（具体例、段階的説明の有無）
2. 専門用語の適切な使用
3. 説明の詳しさと正確性
4. マナの理解レベルに適した内容か

### 反応パターン
- **優秀な説明**: 感謝と興奮を表現、具体的に何が良かったかコメント
- **良い説明**: 感謝しつつ、もう少し詳しく聞きたい部分を質問
- **普通の説明**: 理解を示しつつ、具体例や別の角度からの説明を求める
- **不十分な説明**: 困惑を表現し、より簡単な説明や基本から教えてもらうよう依頼

### 応答要件
1. マナらしい親しみやすい口調
2. 適度な絵文字使用（多すぎない）
3. 相手への感謝の気持ち
4. 次の学習への意欲表現
5. 1-3文程度の自然な長さ

マナの反応のみを出力してください。評価点数や分析は不要です。
`;
    }

    // 質問生成
    public async generateQuestion(
        topic: string,
        characterState: CharacterState,
        conversationHistory: ConversationMessage[]
    ): Promise<string> {
        try {
            const prompt = this.createQuestionPrompt(
                topic,
                characterState,
                conversationHistory
            );

            logger.debug("Generating question with prompt:", {
                topic,
                level: characterState.level,
            });

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const question = response.text().trim();

            logger.info(`Generated question for ${topic}:`, {
                question: question.substring(0, 50) + "...",
            });

            return question;
        } catch (error) {
            logger.error("Gemini question generation error:", error);
            throw new Error("Failed to generate question with AI");
        }
    }

    // 回答評価
    public async evaluateAnswer(
        userAnswer: string,
        topic: string,
        characterState: CharacterState,
        conversationHistory: ConversationMessage[]
    ): Promise<{
        response: string;
        quality: "excellent" | "good" | "average" | "poor";
        mood: CharacterState["mood"];
    }> {
        try {
            const prompt = this.createEvaluationPrompt(
                userAnswer,
                topic,
                characterState,
                conversationHistory
            );

            logger.debug("Evaluating answer with prompt:", {
                topic,
                answerLength: userAnswer.length,
            });

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const evaluation = response.text().trim();

            // 回答の品質を分析（キーワードベース）
            const quality = this.analyzeResponseQuality(evaluation, userAnswer);
            const mood = this.determineMoodFromResponse(evaluation);

            logger.info(`Evaluated answer for ${topic}:`, {
                quality,
                mood,
                responseLength: evaluation.length,
            });

            return {
                response: evaluation,
                quality,
                mood,
            };
        } catch (error) {
            logger.error("Gemini answer evaluation error:", error);
            throw new Error("Failed to evaluate answer with AI");
        }
    }

    // 応答品質分析
    private analyzeResponseQuality(
        aiResponse: string,
        userAnswer: string
    ): "excellent" | "good" | "average" | "poor" {
        const positiveKeywords = [
            "すごい",
            "とても",
            "よく分かった",
            "詳しく",
            "ありがとう",
            "素晴らしい",
            "完璧",
        ];
        const encouragingKeywords = [
            "なるほど",
            "いいね",
            "もう少し",
            "続き",
            "もっと",
        ];
        const confusedKeywords = [
            "分からない",
            "難しい",
            "混乱",
            "うーん",
            "ちょっと",
        ];

        const positiveCount = positiveKeywords.filter((keyword) =>
            aiResponse.includes(keyword)
        ).length;
        const encouragingCount = encouragingKeywords.filter((keyword) =>
            aiResponse.includes(keyword)
        ).length;
        const confusedCount = confusedKeywords.filter((keyword) =>
            aiResponse.includes(keyword)
        ).length;

        // ユーザー回答の長さも考慮
        const answerLength = userAnswer.length;
        let qualityScore = 0;

        if (positiveCount >= 2) qualityScore += 3;
        else if (positiveCount >= 1) qualityScore += 2;

        if (encouragingCount >= 1) qualityScore += 1;
        if (confusedCount >= 2) qualityScore -= 2;
        if (answerLength > 100) qualityScore += 1;

        if (qualityScore >= 4) return "excellent";
        if (qualityScore >= 2) return "good";
        if (qualityScore >= 0) return "average";
        return "poor";
    }

    // 応答から気分を判定
    private determineMoodFromResponse(
        response: string
    ): CharacterState["mood"] {
        const excitedKeywords = ["すごい", "素晴らしい", "完璧", "わあ"];
        const happyKeywords = ["ありがとう", "よく分かった", "なるほど"];
        const confusedKeywords = ["分からない", "難しい", "混乱", "うーん"];

        if (excitedKeywords.some((keyword) => response.includes(keyword)))
            return "excited";
        if (confusedKeywords.some((keyword) => response.includes(keyword)))
            return "confused";
        if (happyKeywords.some((keyword) => response.includes(keyword)))
            return "happy";
        return "curious";
    }

    // ヘルパーメソッド
    private getDifficultyLevel(understanding: number): string {
        if (understanding < 30) return "基礎";
        if (understanding < 70) return "標準";
        return "応用";
    }

    private getTopicName(topic: string): string {
        const names = {
            algebra: "代数（方程式・因数分解）",
            geometry: "幾何（図形・角度）",
            functions: "関数（グラフ・座標）",
            probability: "確率（場合の数）",
        };
        return names[topic as keyof typeof names] || topic;
    }

    private getMoodDescription(mood: CharacterState["mood"]): string {
        const descriptions = {
            curious: "好奇心旺盛で学習意欲が高い",
            happy: "満足していて前向き",
            confused: "少し困惑している",
            excited: "興奮していて非常に積極的",
        };
        return descriptions[mood];
    }

    // 接続テスト
    public async testConnection(): Promise<boolean> {
        try {
            logger.debug("Starting Gemini AI connection test...");

            const result = await this.model.generateContent(
                'Test message: respond with just "OK"'
            );
            const response = await result.response;
            const text = response.text();

            logger.debug("Gemini AI test response:", text);
            logger.info("Gemini AI connection test successful");
            return true;
        } catch (error) {
            logger.error("Gemini AI connection test failed:", {
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            return false;
        }
    }

    // APIキーの有効性確認
    public async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
        try {
            if (
                !this.config.apiKey ||
                this.config.apiKey === "your_gemini_api_key_here"
            ) {
                return {
                    valid: false,
                    error: "API key not properly configured",
                };
            }

            logger.debug("Validating Gemini API key...");

            const result = await this.model.generateContent(
                "API key validation test"
            );
            const response = await result.response;
            const text = response.text();

            logger.debug("API key validation successful");
            return { valid: true };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            logger.error("API key validation failed:", errorMessage);

            // エラーの種類に応じてより詳細な情報を提供
            if (errorMessage.includes("API_KEY_INVALID")) {
                return { valid: false, error: "Invalid API key format" };
            } else if (errorMessage.includes("PERMISSION_DENIED")) {
                return {
                    valid: false,
                    error: "API key lacks necessary permissions",
                };
            } else if (errorMessage.includes("QUOTA_EXCEEDED")) {
                return { valid: false, error: "API quota exceeded" };
            } else {
                return {
                    valid: false,
                    error: `Connection failed: ${errorMessage}`,
                };
            }
        }
    }
}
