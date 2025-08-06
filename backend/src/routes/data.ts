import express from 'express';
import { DataController } from '../controllers/dataController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const dataController = new DataController();

// すべてのルートに認証を適用
router.use(authenticateToken);

// キャラクター状態関連
router.get('/character', dataController.getCharacterState);
router.put('/character', dataController.updateCharacterState);
router.post('/character/experience', dataController.addExperience);
router.put('/character/mood', dataController.updateMood);

// 会話履歴関連
router.get('/conversations', dataController.getConversationHistory);
router.post('/conversations', dataController.saveMessage);

// 統計情報
router.get('/stats', dataController.getStats);

export default router;