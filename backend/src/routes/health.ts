// backend/src/routes/health.ts
import { Router } from "express";
import { healthController } from "../controllers/healthController";

export const healthRouter = Router();

// 基本ヘルスチェック
healthRouter.get("/", healthController.basicHealth);

// 詳細ヘルスチェック
healthRouter.get("/detailed", healthController.detailedHealth);

// AI接続テスト
healthRouter.get("/ai", healthController.aiConnectionTest);

// 単純なAIテスト
healthRouter.get("/ai/simple", healthController.simplestAITest);

// APIキー検証
healthRouter.get("/api-key", healthController.apiKeyValidation);
