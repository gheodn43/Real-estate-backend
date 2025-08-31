import express from 'express';
import ChatMemory from '../models/ChatMemory.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import { getGrokResponse } from '../modules/brain.js';
import { filterProperty, initCustomerNeeds } from '../helpers/propClient.js';

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */
const getIP = (req) =>
  req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const findOrCreateChat = async ({ userEmail, userIP }) => {
  let chat = userEmail
    ? await ChatMemory.findOne({ userEmail }) // Ưu tiên tìm theo userEmail trước
    : null;

  // Nếu có userEmail nhưng chưa có chat, thử tìm theo userIP
  if (!chat && userIP) {
    chat = await ChatMemory.findOne({ userIP });
    if (chat) {
      chat.userEmail = userEmail;
    }
  }

  // Nếu không có thì tạo mới
  if (!chat) {
    chat = new ChatMemory({
      userEmail: userEmail || null,
      userIP,
      context: 'Cuộc trò chuyện mới bắt đầu.',
    });
  }

  return chat;
};

const updateChat = async (
  chat,
  { message, reply, properties, updatedContext }
) => {
  chat.memory.push({
    human: message,
    agent: reply,
    properties: properties,
    status: 'completed',
    timestamp: new Date(),
  });
  if (chat.memory.length > 100) {
    chat.memory = chat.memory.slice(chat.memory.length - 100);
  }

  chat.context = updatedContext;
  chat.lastInteraction = new Date();
  await chat.save();

  return chat;
};

/**
 * Lấy lịch sử chat có phân trang
 */
const getChatHistory = (chat, page, limit) => {
  const reversedMemory = [...chat.memory].reverse();
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  return {
    chatHistory: reversedMemory.slice(startIndex, endIndex),
    currentPage: Number(page),
    totalPages: Math.ceil(chat.memory.length / limit),
  };
};

/* ----------------------------- Routes ----------------------------- */

// Test filter property
router.post('/test/filter', async (req, res) => {
  const { lat, lng } = req.body;
  const properties = await filterProperty(lat, lng);

  res.json({
    data: { properties },
    message: 'success',
    error: [],
  });
});

// Test chat với userEmail
router.post('/test/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
  const { message, lat, lng } = req.body;

  if (!userEmail || !message) {
    return res.status(400).json({ error: 'Missing userEmail or message' });
  }

  try {
    let chat = await findOrCreateChat({ userEmail });
    const currentContext = chat.context;

    const { reply, updatedContext } = await getGrokResponse(
      message,
      currentContext,
      { lat, lng }
    );
    chat = await updateChat(chat, { message, reply, updatedContext });

    res.json({
      data: { reply, updatedContext, properties: [] },
      message: 'success',
      error: [],
    });
  } catch (err) {
    res.status(500).json({ data: null, message: '', error: [err.message] });
  }
});

/**
 * @openapi
 * /agent-chat/init-session:
 *   post:
 *     summary: Khởi tạo phiên chat mới
 *     tags:
 *       - Chatbot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email user
 *               name:
 *                 type: string
 *                 description: Name user
 *               number_phone:
 *                 type: string
 *                 description: number_phone user
 *               lat:
 *                 type: number
 *                 format: double
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 format: double
 *                 description: Longitude
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/init-session', async (req, res) => {
  const userIP = getIP(req);
  const { email, name, number_phone, lat, lng } = req.body;
  try {
    await initCustomerNeeds(email, name, number_phone, lat, lng);
    let chat = new ChatMemory({
      userEmail: email || null,
      userIP,
      context: 'Cuộc trò chuyện mới bắt đầu.',
      lastInteraction: new Date(),
    });
    await chat.save();
    res.json({
      data: {
        reply: 'Chào Anh/Chị, em có thể giúp gì cho Anh/Chị ạ!',
        updatedContext: chat.context,
        properties: [],
      },
      message: 'success',
      error: [],
    });
  } catch (err) {
    res.status(500).json({ data: null, message: '', error: [err.message] });
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
 *               lat:
 *                 type: number
 *                 format: double
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 format: double
 *                 description: Longitude
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/', authMiddleware, async (req, res) => {
  const userEmail = req.user.userEmail;
  const userIP = getIP(req);
  const { message, lat, lng } = req.body;

  if (!userEmail || !message) {
    return res.status(400).json({ error: 'Missing userEmail or message' });
  }

  try {
    let chat = await findOrCreateChat({ userEmail, userIP });
    const currentContext = chat.context;

    const { reply, updatedContext, properties } = await getGrokResponse(
      message,
      currentContext,
      lat,
      lng
    );
    chat = await updateChat(chat, {
      message,
      reply,
      properties,
      updatedContext,
    });

    res.json({
      data: { reply, updatedContext, properties },
      message: 'success',
      error: [],
    });
  } catch (err) {
    res.status(500).json({ data: null, message: '', error: [err.message] });
  }
});

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
 *               lat:
 *                 type: number
 *                 format: double
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 format: double
 *                 description: Longitude
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
    let chat = await findOrCreateChat({ userIP });
    const currentContext = chat.context;

    const { reply, updatedContext, properties } = await getGrokResponse(
      message,
      currentContext,
      lat,
      lng
    );
    chat = await updateChat(chat, {
      message,
      reply,
      properties,
      updatedContext,
    });

    res.json({
      data: { reply, updatedContext, properties },
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
 *     summary: Lấy lịch sử trọ chuyện của ngừoi dùng
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
    const userEmail = req.user.userEmail;
    const { page = 1, limit = 10 } = req.query;
    const userIP = getIP(req);

    try {
      let chat = userEmail
        ? await ChatMemory.findOne({ userEmail }) // Ưu tiên tìm theo userEmail trước
        : null;

      // Nếu có userEmail nhưng chưa có chat, thử tìm theo userIP
      if (!chat && userIP) {
        chat = await ChatMemory.findOne({ userIP });
      }
      if (!chat)
        return res
          .status(404)
          .json({ data: null, message: '', error: ['Chat not found'] });

      const history = getChatHistory(chat, page, limit);
      res.status(200).json({ data: history, message: 'success', error: [] });
    } catch (err) {
      res.status(500).json({ data: null, message: '', error: [err.message] });
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
      return res
        .status(404)
        .json({ data: null, message: '', error: ['Chat not found'] });
    }

    const history = getChatHistory(chat, page, limit);
    res.status(200).json({ data: history, message: 'success', error: [] });
  } catch (err) {
    res.status(500).json({ data: null, message: '', error: [err.message] });
  }
});

export default router;
