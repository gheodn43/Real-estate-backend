import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import { kiemDuyetBinhLuanByAI } from '../modules/censorshipContent.js';
const router = express.Router();

/**
 * @openapi
 * /agent-chat/censorship/comment:
 *   post:
 *     summary: Kiểm duyệt bình luânj
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
 *               comment:
 *                 type: string
 *                 description: User message
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/comment', authMiddleware, async (req, res) => {
  const { comment } = req.body;
  const passed = await kiemDuyetBinhLuanByAI(comment);
  res.json({
    data: {
      passed: passed,
    },
    message: 'success',
    error: [],
  });
});

export default router;
