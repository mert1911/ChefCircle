import { Router } from 'express';
import { sendChatMessage } from '../controllers/chatbot.controller';
import auth from '../middleware/auth';

const router = Router();

// POST /api/chatbot/chat - Send a message to the AI chatbot
router.post('/chat', auth, sendChatMessage);

export default router; 