// backend/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger } from "../utils/logger";

// キャラクター状態のバリデーションスキーマ
const characterStateSchema = Joi.object({
    name: Joi.string().required(),
    level: Joi.number().integer().min(1).required(),
    experience: Joi.number().integer().min(0).required(),
    maxExp: Joi.number().integer().min(1).required(),
    understanding: Joi.object({
        algebra: Joi.number().min(0).max(100).required(),
        geometry: Joi.number().min(0).max(100).required(),
        functions: Joi.number().min(0).max(100).required(),
        probability: Joi.number().min(0).max(100).required(),
    }).required(),
    mood: Joi.string()
        .valid("curious", "happy", "confused", "excited")
        .required(),
    totalProblems: Joi.number().integer().min(0).required(),
    personality: Joi.string().required(),
});

// 会話メッセージのバリデーションスキーマ
const conversationMessageSchema = Joi.object({
    role: Joi.string().required(),
    content: Joi.string().required(),
    timestamp: Joi.string().isoDate().required(),
});

// チャットリクエストのバリデーションスキーマ
const chatRequestSchema = Joi.object({
    message: Joi.string().allow("").optional(),
    conversationHistory: Joi.array()
        .items(conversationMessageSchema)
        .required(),
    characterState: characterStateSchema.required(),
    currentTopic: Joi.string()
        .valid("algebra", "geometry", "functions", "probability")
        .required(),
    requestType: Joi.string().valid("question", "answer").required(),
});

export const validateChatRequest = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { error, value } = chatRequestSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            logger.warn("Validation error:", errorMessages);

            return res.status(400).json({
                error: "Invalid request data",
                details: errorMessages,
            });
        }

        // 追加のビジネスロジック検証
        const businessValidationError = validateBusinessRules(value);
        if (businessValidationError) {
            logger.warn("Business validation error:", businessValidationError);
            return res.status(400).json({
                error: "Business rule violation",
                message: businessValidationError,
            });
        }

        req.body = value;
        next();
    } catch (err) {
        logger.error("Validation middleware error:", err);
        res.status(500).json({ error: "Internal validation error" });
    }
};

// ビジネスルールの検証
function validateBusinessRules(data: any): string | null {
    // メッセージが必要なリクエストタイプの場合
    if (
        data.requestType === "answer" &&
        (!data.message || data.message.trim().length === 0)
    ) {
        return "Message is required for answer evaluation";
    }

    // メッセージが長すぎる場合
    if (data.message && data.message.length > 2000) {
        return "Message is too long (max 2000 characters)";
    }

    // 会話履歴が多すぎる場合
    if (data.conversationHistory.length > 100) {
        return "Conversation history is too long (max 100 messages)";
    }

    // キャラクターレベルと経験値の整合性チェック
    const expectedLevel =
        Math.floor(
            data.characterState.experience / data.characterState.maxExp
        ) + 1;
    if (Math.abs(data.characterState.level - expectedLevel) > 1) {
        return "Character level and experience are inconsistent";
    }

    return null;
}

// 認証用バリデーションスキーマ
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const validateAuth = {
    register: (req: Request, res: Response, next: NextFunction) => {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }
        next();
    },

    login: (req: Request, res: Response, next: NextFunction) => {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }
        next();
    }
};
