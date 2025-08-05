// backend/src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { chatRouter } from "./routes/chat";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet());

// CORS設定
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? ["https://your-app.vercel.app"] // 本番環境のドメインに変更
                : ["http://localhost:3000", "http://localhost:5173"], // 開発環境
        credentials: true,
    })
);

// レート制限
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // リクエスト制限
    message: "Too many requests from this IP",
});
app.use("/api", limiter);

// JSON解析
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ログ出力
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// APIルート
app.use("/api/chat", chatRouter);

// ヘルスチェック
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ルートエンドポイント
app.get("/", (req, res) => {
    res.json({
        message: "Math Teaching API Server",
        version: "1.0.0",
        endpoints: [
            "POST /api/chat - Chat with Mana",
            "GET /health - Health check",
        ],
    });
});

// エラーハンドリング
app.use(errorHandler);

// 404ハンドリング
app.use("*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// サーバー起動
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
