// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // ログ出力
    logger.error("Error occurred:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });

    // 開発環境では詳細なエラー情報を返す
    if (process.env.NODE_ENV === "development") {
        return res.status(statusCode).json({
            error: message,
            stack: err.stack,
            statusCode,
            path: req.path,
        });
    }

    // 本番環境では安全なエラーメッセージのみ
    const safeErrors: { [key: number]: string } = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        429: "Too Many Requests",
        500: "Internal Server Error",
    };

    // 運用エラー（予期されたエラー）の場合はそのまま返す
    if (err.isOperational) {
        return res.status(statusCode).json({
            error: message,
            code: err.code,
        });
    }

    // その他のエラーは安全なメッセージに置き換え
    res.status(statusCode).json({
        error: safeErrors[statusCode] || safeErrors[500],
        message: statusCode < 500 ? message : "Something went wrong",
    });
};

// カスタムエラークラス
export class APIError extends Error {
    statusCode: number;
    code?: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// 非同期エラーハンドラー
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
