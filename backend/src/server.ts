// backend/src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// 環境変数の読み込み
console.log("=== Environment Loading Debug ===");
console.log("Current working directory:", process.cwd());
console.log("__dirname:", __dirname);

// 複数の.envパスを試行
const possibleEnvPaths = [
    path.join(process.cwd(), ".env"), // カレントディレクトリ
    path.join(__dirname, "../.env"), // src/../.env
    path.join(__dirname, "../../.env"), // dist/../../.env (コンパイル後)
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
    console.log(`Trying to load .env from: ${envPath}`);
    if (require("fs").existsSync(envPath)) {
        console.log(`✅ Found .env file at: ${envPath}`);
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
            console.log("✅ .env file loaded successfully");
            envLoaded = true;
            break;
        }
    } else {
        console.log(`❌ .env file not found at: ${envPath}`);
    }
}

if (!envLoaded) {
    console.log("⚠️ Trying default dotenv.config()...");
    dotenv.config();
}

// 環境変数の確認（デバッグ用）
console.log("=== Environment Variables ===");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- PORT:", process.env.PORT);
console.log(
    "- GEMINI_API_KEY length:",
    process.env.GEMINI_API_KEY?.length || "NOT_SET"
);
console.log("- GEMINI_MODEL:", process.env.GEMINI_MODEL);
console.log("===============================");

import { chatRouter } from "./routes/chat";
import { healthRouter } from "./routes/health";
import authRouter from "./routes/auth";
import dataRouter from "./routes/data";
import adaptiveLearningRouter from "./routes/adaptiveLearning";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

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
app.use("/api/auth", authRouter);
app.use("/api/data", dataRouter);
app.use("/api/adaptive", adaptiveLearningRouter);

// ヘルスチェックルート
app.use("/health", healthRouter);

// ルートエンドポイント
app.get("/", (req, res) => {
    res.json({
        message: "Math Teaching API Server",
        version: "1.0.0",
        status: "Running",
        endpoints: [
            "POST /api/chat - Chat with Mana",
            "POST /api/auth/register - User registration",
            "POST /api/auth/login - User login",
            "GET /api/auth/profile - Get user profile",
            "GET /api/data/character - Get character state",
            "PUT /api/data/character - Update character state",
            "POST /api/data/character/experience - Add experience",
            "GET /api/data/conversations - Get conversation history",
            "POST /api/data/conversations - Save message",
            "GET /api/data/stats - Get user stats",
            "GET /api/adaptive/metrics - Get learning metrics",
            "GET /api/adaptive/recommendations - Get adaptive recommendations",
            "GET /api/adaptive/learning-path - Get learning path",
            "GET /api/adaptive/personality-profile - Get personality profile",
            "POST /api/adaptive/enhanced-chat - Enhanced AI chat",
            "GET /api/adaptive/detailed-analysis - Get detailed analysis",
            "GET /health - Basic health check",
            "GET /health/detailed - Detailed health check",
            "GET /health/ai - AI connection test",
            "GET /health/ai/simple - Simple AI test",
            "GET /health/api-key - API key validation",
            "GET /test - Test endpoint",
        ],
    });
});

// デバッグ用エンドポイント
app.get("/test", (req, res) => {
    res.json({
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        port: PORT,
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
