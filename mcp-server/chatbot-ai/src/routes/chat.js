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
    // Tìm cuộc hội thoại của người dùng
    let chat = await ChatMemory.findOne({ userId });

    if (!chat) {
      chat = new ChatMemory({
        userId,
        context: 'Cuộc trò chuyện mới bắt đầu.',
      });
    }

    // Lấy ngữ cảnh hiện tại
    const currentContext = chat.context;

    // Gửi tin nhắn, ngữ cảnh, và lịch sử (nếu cần) đến API của xAI với mô hình grok-3-mini
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

    res.json({ reply, context: updatedContext });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
