import express from 'express';
import ChatMemory from '../models/ChatMemory.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import { getGrokResponse } from '../modules/brain.js';
import { filterProperty } from '../helpers/propClient.js';

const router = express.Router();

router.post('/test/filter', async (req, res) => {
  const { lat, lng } = req.body;
  const properties = await filterProperty(lat, lng);

  res.json({
    data: {
      properties,
    },
    message: 'success',
    error: [],
  });
});
router.post('/test/:userId', async (req, res) => {
  const { userId } = req.params;
  const { message, lat, lng } = req.body;

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
      currentContext,
      { lat, lng }
    );
    //update chat memory
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
    res.status(500).json({
      data: null,
      message: '',
      error: [err.message],
    });
  }
});

/**
 * @openapi
 * /agent-chat:
 *   post:
 *     summary: Test chatbot
 *     description: Test chatbot
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  '/',
  authMiddleware,
  roleGuard([
    RoleName.Customer,
    RoleName.Agent,
    RoleName.Journalist,
    RoleName.Admin,
  ]),
  async (req, res) => {
    const userId = req.user.userId;
    const userIP = getIP(req);
    const { message, lat, lng } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }
    try {
      let chat = await ChatMemory.findOne({ userId });
      if (!chat) {
        chat = await ChatMemory.findOne({ userId: null, userIP });
        if (chat) {
          chat.userId = userId;
        }
      }
      if (!chat) {
        chat = new ChatMemory({
          userId,
          context: 'Cuộc trò chuyện mới bắt đầu.',
        });
      }
      const currentContext = chat.context;
      const { reply, updatedContext } = await getGrokResponse(
        message,
        currentContext,
        { lat, lng }
      );
      //update chat memory
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
      res.status(500).json({
        data: null,
        message: '',
        error: [err.message],
      });
    }
  }
);

/**
 * @openapi
 * /agent-chat/public:
 *   post:
 *     summary: public chatbot
 *     description: public chatbot
 *     tags:
 *       - Chatbot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/public', async (req, res) => {
  const { message, lat, lng } = req.body;
  const userIP = getIP(req);

  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  try {
    let chat = await ChatMemory.findOne({ userIP });
    if (!chat) {
      chat = new ChatMemory({
        userIP,
        context: 'Cuộc trò chuyện mới bắt đầu.',
      });
    }

    const currentContext = chat.context;
    const { reply, updatedContext } = await getGrokResponse(
      message,
      currentContext,
      { lat, lng }
    );

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
        reply,
        updatedContext,
        properties: [],
      },
      message: 'success',
      error: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: '',
      error: [err.message],
    });
  }
});

/**
 * @openapi
 * /agent-chat/history:
 *   get:
 *     summary: Lấy lịch sử trọ chuyện của ngừoi dùng [customer]
 *     description: Get chat history
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Limit number of messages
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/history',
  authMiddleware,
  roleGuard([
    RoleName.Customer,
    RoleName.Agent,
    RoleName.Journalist,
    RoleName.Admin,
  ]),
  async (req, res) => {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const userIP = getIP(req);
    try {
      const chat = await ChatMemory.findOne({ userId, userIP });
      if (!chat) {
        return res.status(404).json({
          data: null,
          message: '',
          error: ['Chat not found'],
        });
      }

      const reversedMemory = [...chat.memory].reverse(); // đảo ngược để lấy tin mới nhất trước
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const chatHistory = reversedMemory.slice(startIndex, endIndex);

      return res.status(200).json({
        data: {
          chatHistory,
          currentPage: Number(page),
          totalPages: Math.ceil(chat.memory.length / limit),
        },
        message: 'success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: '',
        error: [err.message],
      });
    }
  }
);

/**
 * @openapi
 * /agent-chat/history-public:
 *   get:
 *     summary: Lấy lịch sử trọ chuyện của ngừoi dùng
 *     description: Get chat history
 *     tags:
 *       - Chatbot
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Limit number of messages
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history-public', async (req, res) => {
  const userIP = getIP(req);
  const { page = 1, limit = 10 } = req.query;
  try {
    const chat = await ChatMemory.findOne({ userIP });
    if (!chat) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Chat not found'],
      });
    }
    const reversedMemory = [...chat.memory].reverse(); // đảo ngược để lấy tin mới nhất trước
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const chatHistory = reversedMemory.slice(startIndex, endIndex);

    return res.status(200).json({
      data: {
        chatHistory,
        currentPage: Number(page),
        totalPages: Math.ceil(chat.memory.length / limit),
      },
      message: 'success',
      error: [],
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      message: '',
      error: [err.message],
    });
  }
});

const getIP = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
};

export default router;
