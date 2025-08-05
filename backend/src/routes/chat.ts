// backend/src/routes/chat.ts
import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { validateChatRequest } from "../middleware/validation";

export const chatRouter = Router();

// チャットエンドポイント
chatRouter.post("/", validateChatRequest, chatController.handleChat);

// 質問生成エンドポイント
chatRouter.post(
    "/question",
    validateChatRequest,
    chatController.generateQuestion
);

// 回答評価エンドポイント
chatRouter.post(
    "/evaluate",
    validateChatRequest,
    chatController.evaluateAnswer
);
