import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateAuth } from '../middleware/validation';

const router = express.Router();
const authController = new AuthController();

router.post('/register', validateAuth.register, authController.register);
router.post('/login', validateAuth.login, authController.login);
router.get('/profile', authenticateToken, authController.getProfile);

export default router;