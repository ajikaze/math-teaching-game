// backend/src/controllers/healthController.ts
import { Request, Response } from "express";
import { logger } from "../utils/logger";

// 遅延インポートのための変数
let mathQuestionService: any = null;
let answerEvaluationService: any = null;

class HealthController {
    // サービスを遅延初期化
    private async getServices() {
        if (!mathQuestionService || !answerEvaluationService) {
            logger.info("Initializing AI services for health check...");
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

    // 基本ヘルスチェック
    public basicHealth = (req: Request, res: Response) => {
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            version: "1.0.0",
        });
    };

    // 詳細ヘルスチェック（AI接続含む）
    public detailedHealth = async (req: Request, res: Response) => {
        try {
            const healthStatus = {
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
                version: "1.0.0",
                services: {
                    api: "OK",
                    questionService: "UNKNOWN",
                    evaluationService: "UNKNOWN",
                    geminiAI: "UNKNOWN",
                },
            };

            // 各サービスの接続テスト
            try {
                const { questionService } = await this.getServices();
                const questionAIStatus =
                    await questionService.testAIConnection();
                healthStatus.services.questionService = questionAIStatus
                    ? "OK"
                    : "FALLBACK";
            } catch (error) {
                healthStatus.services.questionService = "ERROR";
                logger.warn("Question service health check failed:", error);
            }

            try {
                const { evaluationService } = await this.getServices();
                const evaluationAIStatus =
                    await evaluationService.testAIConnection();
                healthStatus.services.evaluationService = evaluationAIStatus
                    ? "OK"
                    : "FALLBACK";
            } catch (error) {
                healthStatus.services.evaluationService = "ERROR";
                logger.warn("Evaluation service health check failed:", error);
            }

            // Gemini AI全体のステータス
            const hasGeminiAPI = !!process.env.GEMINI_API_KEY;
            healthStatus.services.geminiAI = hasGeminiAPI
                ? healthStatus.services.questionService === "OK" ||
                  healthStatus.services.evaluationService === "OK"
                    ? "OK"
                    : "CONFIGURED_BUT_FAILED"
                : "NOT_CONFIGURED";

            // 全体ステータスの決定
            const allServicesOK = Object.values(healthStatus.services).every(
                (status) => status === "OK" || status === "FALLBACK"
            );

            if (!allServicesOK) {
                healthStatus.status = "DEGRADED";
            }

            res.json(healthStatus);
        } catch (error) {
            logger.error("Detailed health check failed:", error);
            res.status(500).json({
                status: "ERROR",
                timestamp: new Date().toISOString(),
                error: "Health check failed",
            });
        }
    };

    // AI接続専用テスト
    public aiConnectionTest = async (req: Request, res: Response) => {
        try {
            const results = {
                geminiConfigured: !!process.env.GEMINI_API_KEY,
                apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
                questionService: false,
                evaluationService: false,
                overall: false,
                errors: [] as string[],
            };

            if (results.geminiConfigured) {
                try {
                    const { questionService } = await this.getServices();
                    results.questionService =
                        await questionService.testAIConnection();
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    results.errors.push(`Question service: ${errorMessage}`);
                    logger.warn("Question service AI test failed:", error);
                }

                try {
                    const { evaluationService } = await this.getServices();
                    results.evaluationService =
                        await evaluationService.testAIConnection();
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    results.errors.push(`Evaluation service: ${errorMessage}`);
                    logger.warn("Evaluation service AI test failed:", error);
                }
            }

            results.overall =
                results.geminiConfigured &&
                (results.questionService || results.evaluationService);

            res.json({
                timestamp: new Date().toISOString(),
                ai_status: results,
                recommendations: this.generateRecommendations(results),
            });
        } catch (error) {
            logger.error("AI connection test failed:", error);
            res.status(500).json({
                error: "AI connection test failed",
                timestamp: new Date().toISOString(),
            });
        }
    };

    // 単純なGemini APIテスト
    public simplestAITest = async (req: Request, res: Response) => {
        try {
            if (!process.env.GEMINI_API_KEY) {
                return res.json({
                    success: false,
                    error: "GEMINI_API_KEY not configured",
                });
            }

            // 直接Gemini APIをテスト
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            logger.debug("Testing direct Gemini API connection...");

            const result = await model.generateContent(
                'Hello, respond with just "OK" if you can hear me.'
            );
            const response = await result.response;
            const text = response.text();

            logger.debug("Gemini API raw response:", text);

            res.json({
                success: true,
                response: text.trim(),
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error("Direct Gemini API test failed:", error);
            res.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    };

    // APIキー詳細テスト
    public apiKeyValidation = async (req: Request, res: Response) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return res.json({
                    configured: false,
                    error: "GEMINI_API_KEY environment variable not set",
                });
            }

            if (apiKey === "your_gemini_api_key_here") {
                return res.json({
                    configured: false,
                    error: "GEMINI_API_KEY is still set to placeholder value",
                });
            }

            // 複数のモデル名を試行
            const modelsToTry = [
                "gemini-1.5-pro",
                "gemini-1.5-flash",
                "gemini-pro",
            ];
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(apiKey);

            for (const modelName of modelsToTry) {
                try {
                    logger.debug(`Testing model: ${modelName}`);
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                    });
                    const validation = await model.generateContent(
                        "Test message"
                    );
                    const response = await validation.response;
                    const text = response.text();

                    return res.json({
                        configured: true,
                        valid: true,
                        keyLength: apiKey.length,
                        workingModel: modelName,
                        testResponse: text.substring(0, 50) + "...",
                        timestamp: new Date().toISOString(),
                    });
                } catch (modelError) {
                    logger.debug(
                        `Model ${modelName} failed:`,
                        modelError instanceof Error
                            ? modelError.message
                            : "Unknown error"
                    );
                    continue;
                }
            }

            // すべてのモデルが失敗した場合
            res.json({
                configured: true,
                valid: false,
                keyLength: apiKey.length,
                error:
                    "No working models found. Tried: " + modelsToTry.join(", "),
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error("API key validation failed:", error);
            res.status(500).json({
                error: "Validation process failed",
                timestamp: new Date().toISOString(),
            });
        }
    };

    private generateRecommendations(results: any): string[] {
        const recommendations: string[] = [];

        if (!results.geminiConfigured) {
            recommendations.push("Set GEMINI_API_KEY environment variable");
        }

        if (
            results.geminiConfigured &&
            !results.questionService &&
            !results.evaluationService
        ) {
            recommendations.push("Check Gemini API key validity");
            recommendations.push(
                "Verify network connectivity to Google AI services"
            );
        }

        if (results.overall) {
            recommendations.push("AI services are working correctly");
        } else if (results.geminiConfigured) {
            recommendations.push(
                "AI partially working - fallback systems active"
            );
        } else {
            recommendations.push(
                "Running in fallback mode with template responses"
            );
        }

        return recommendations;
    }
}

export const healthController = new HealthController();
