import express from 'express';
import agentReviewController from '../controllers/agentReview.controller.js';
import {
  authenticateToken,
  authorizeAgent,
  authorizeAdmin,
} from '../middleware/authenticateToken.js';

const router = express.Router();

console.log('authenticateToken:', typeof authenticateToken);
console.log('authorizeAgent:', typeof authorizeAgent);
console.log('authorizeAdmin:', typeof authorizeAdmin);
console.log('createReply:', typeof agentReviewController.createReply);

/**
 * @swagger
 * /agent-reviews:
 *   post:
 *     summary: Tạo hoặc cập nhật đánh giá cho Agent
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [comment, repcomment]
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post('/', authenticateToken, agentReviewController.createOrUpdateReview);

/**
 * @swagger
 * /agent-reviews/{id}:
 *   put:
 *     summary: Cập nhật đánh giá cho Agent
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Thành công
 */
router.put(
  '/:id',
  authenticateToken,
  agentReviewController.createOrUpdateReview
);

/**
 * @swagger
 * /agent-reviews/{id}/reply:
 *   post:
 *     summary: Agent trả lời đánh giá
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post(
  '/:id/reply',
  authenticateToken,
  authorizeAgent,
  agentReviewController.createReply
);

/**
 * @swagger
 * /agent-reviews/{id}:
 *   delete:
 *     summary: Xóa đánh giá
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete('/:id', authenticateToken, agentReviewController.deleteReview);

/**
 * @swagger
 * /agent-reviews:
 *   get:
 *     summary: Lấy danh sách đánh giá của Agent
 *     tags: [AgentReview]
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', agentReviewController.getAgentReviews);

/**
 * @swagger
 * /agent-reviews/summary:
 *   get:
 *     summary: Lấy tổng kết đánh giá của Agent
 *     tags: [AgentReview]
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/summary', agentReviewController.getAgentReviewSummary);

/**
 * @swagger
 * /agent-reviews/{agent_id}/user:
 *   get:
 *     summary: Lấy đánh giá của user hiện tại với Agent
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  '/:agent_id/user',
  authenticateToken,
  agentReviewController.getUserReview
);

/**
 * @swagger
 * /agent-reviews/{id}/approve:
 *   put:
 *     summary: Admin duyệt repcomment
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put(
  '/:id/approve',
  authenticateToken,
  authorizeAdmin,
  agentReviewController.approveReply
);

/**
 * @swagger
 * /agent-reviews/{id}/reject:
 *   put:
 *     summary: Admin từ chối repcomment
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put(
  '/:id/reject',
  authenticateToken,
  authorizeAdmin,
  agentReviewController.rejectReply
);

/**
 * @swagger
 * /agent-reviews/{id}/admin-reply:
 *   post:
 *     summary: Admin trả lời đánh giá
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post(
  '/:id/admin-reply',
  authenticateToken,
  authorizeAdmin,
  agentReviewController.adminReply
);

export default router;
