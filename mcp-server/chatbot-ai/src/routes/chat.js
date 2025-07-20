import express from 'express';
import ChatMemory from '../models/ChatMemory.js';
import { getGrokResponse } from '../modules/brain.js';

const router = express.Router();

router.post('/test', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    let chat = await ChatMemory.findOne({ userId });

    if (!chat) {
      chat = new ChatMemory({
        userId,
        context: 'Cuộc trò chuyện mới bắt đầu.',
      });
    }
    const currentContext = chat.context;
    const { reply, updatedContext } = await getGrokResponse(
      message,
      currentContext
    );

    // Lưu tin nhắn và phản hồi vào MongoDB
    chat.memory.push({
      human: message,
      agent: reply,
      status: 'completed',
      timestamp: new Date(),
    });

    chat.context = updatedContext;
    if (chat.memory.length > 100) {
      chat.memory = chat.memory.slice(chat.memory.length - 100);
    }

    chat.lastInteraction = new Date();
    await chat.save();

    res.json({
      data: {
        reply: reply,
        updatedContext: updatedContext,
        properties: [],
      },
      message: 'success',
      error: [],
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({
      data: null,
      message: '',
      error: [err.message],
    });
  }
});

export default router;
