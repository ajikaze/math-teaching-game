// backend/src/controllers/chatController.ts
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { CharacterState, ConversationMessage } from "../types";

// 遅延インポートのための変数
let mathQuestionService: any = null;
let answerEvaluationService: any = null;

interface ChatRequest extends Request {
    body: {
        message?: string;
        conversationHistory: ConversationMessage[];
        characterState: CharacterState;
        currentTopic: string;
        requestType: "question" | "answer";
    };
}

class ChatController {
    // サービスを遅延初期化
    private async getServices() {
        if (!mathQuestionService || !answerEvaluationService) {
            logger.info("Initializing AI services...");
            const { MathQuestionService } = await import(
                "../services/mathQuestionService"
            );
            const { AnswerEvaluationService } = await import(
                "../services/answerEvaluationService"
            );

            mathQuestionService = new MathQuestionService();
            answerEvaluationService = new AnswerEvaluationService();
        }

        return {
            questionService: mathQuestionService,
            evaluationService: answerEvaluationService,
        };
    }

    // メインチャットハンドラー
    public handleChat = async (req: ChatRequest, res: Response) => {
        try {
            const { requestType } = req.body;

            if (requestType === "question") {
                return this.generateQuestion(req, res);
            } else if (requestType === "answer") {
                return this.evaluateAnswer(req, res);
            } else {
                return res.status(400).json({ error: "Invalid request type" });
            }
        } catch (error) {
            logger.error("Chat handler error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    };

    // 質問生成
    public generateQuestion = async (req: ChatRequest, res: Response) => {
        try {
            const { characterState, currentTopic, conversationHistory } =
                req.body;
            const { questionService } = await this.getServices();

            logger.info(`Generating question for topic: ${currentTopic}`);

            const question = await questionService.generateQuestion({
                topic: currentTopic,
                characterLevel: characterState.level,
                understanding: characterState.understanding,
                conversationHistory,
            });

            res.json({
                response: question,
                timestamp: new Date().toISOString(),
                metadata: {
                    topic: currentTopic,
                    difficulty: this.calculateDifficulty(characterState),
                    type: "question",
                },
            });
        } catch (error) {
            logger.error("Question generation error:", error);
            res.status(500).json({
                error: "Failed to generate question",
                response:
                    "ごめんね、今は質問を考えるのが難しいみたい...😅 少し待ってからもう一度試してもらえる？",
            });
        }
    };

    // 回答評価
    public evaluateAnswer = async (req: ChatRequest, res: Response) => {
        try {
            const {
                message,
                characterState,
                currentTopic,
                conversationHistory,
            } = req.body;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ error: "Message is required" });
            }

            const { evaluationService } = await this.getServices();

            logger.info(`Evaluating answer for topic: ${currentTopic}`);

            const evaluation = await evaluationService.evaluateAnswer({
                userAnswer: message,
                topic: currentTopic,
                characterState,
                conversationHistory,
            });

            res.json({
                response: evaluation.response,
                expGain: evaluation.experienceGain,
                mood: evaluation.newMood,
                timestamp: new Date().toISOString(),
                metadata: {
                    topic: currentTopic,
                    understanding: evaluation.understandingImprovement,
                    type: "evaluation",
                },
            });
        } catch (error) {
            logger.error("Answer evaluation error:", error);
            res.status(500).json({
                error: "Failed to evaluate answer",
                response:
                    "すみません、今は調子が悪いみたいです... 後でもう一度試してもらえますか？😅",
                expGain: 0,
                mood: "confused",
            });
        }
    };

    // 難易度計算
    private calculateDifficulty(
        characterState: CharacterState
    ): "beginner" | "intermediate" | "advanced" {
        const avgUnderstanding =
            Object.values(characterState.understanding).reduce(
                (sum, val) => sum + val,
                0
            ) / Object.keys(characterState.understanding).length;

        if (avgUnderstanding < 30) return "beginner";
        if (avgUnderstanding < 70) return "intermediate";
        return "advanced";
    }
}

export const chatController = new ChatController();
