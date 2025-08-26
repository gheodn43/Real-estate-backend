import express from 'express';
import agentReviewController from '../controllers/agentReview.controller.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

/**
 * @swagger
 * /review/agent-reviews:
 *   post:
 *     summary: Tạo đánh giá mới cho Agent [Customer]

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
 *                 enum: [comment]
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 *       403:
 *         description: 'Tạo đánh giá thất bại (ví dụ: review đã tồn tại)'
 */
router.post(
  '/',
  authenticateToken,
  roleGuard([RoleName.Customer, RoleName.Admin]),
  agentReviewController.createReview
);

/**
 * @swagger
 * /review/agent-reviews/{id}:

 *   put:
 *     summary: Cập nhật đánh giá cho Agent [Customer]
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
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật đánh giá thành công
 *       403:
 *         description: 'Cập nhật thất bại (ví dụ: review đã bị xóa hoặc không có quyền)'
 */
router.put(
  '/:id',
  authenticateToken,
  roleGuard([RoleName.Customer, RoleName.Admin]),
  agentReviewController.updateReview
);

/**
 * @swagger
 * /review/agent-reviews/{id}/reply:
 *   post:
 *     summary: Trả lời đánh giá [Agent hoặc Admin]
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đánh giá cần trả lời
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Nội dung trả lời
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách URL hình ảnh
 *     responses:
 *       201:
 *         description: Trả lời đánh giá thành công
 *       400:
 *         description: Yêu cầu không hợp lệ (thiếu body hoặc comment)
 *       403:
 *         description: Trả lời thất bại (ví dụ không có quyền hoặc đánh giá không tồn tại)
 */
router.post(
  '/:id/reply',
  authenticateToken,
  roleGuard([RoleName.Agent, RoleName.Admin]),
  agentReviewController.reply
);

/**
 * @swagger
 * /review/agent-reviews/{id}:

 *   delete:
 *     summary: Xóa đánh giá [Customer]

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
 *         description: Xóa đánh giá thành công
 *       403:
 *         description: 'Xóa thất bại (ví dụ: không có quyền)'
 */
router.delete('/:id', authenticateToken, agentReviewController.deleteReview);

/**
 * @swagger
 * /review/agent-reviews:
 *   get:
 *     summary: Lấy danh sách và tổng kết đánh giá của Agent [Customer]
 *     tags: [AgentReview]
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của agent
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đánh giá mỗi trang
 *       - in: query
 *         name: pageProperties
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limitProperties
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bđs giá mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: search bđs theo title và description
 *     responses:
 *       200:
 *         description: Lấy danh sách và tổng kết thành công
 *       403:
 *         description: Lấy danh sách và tổng kết thất bại
 */
router.get('/', agentReviewController.getAgentReviews);

/**
 * @swagger
 * /review/agent-reviews/agent/comments-needing-reply:
 *   get:
 *     summary: Lấy danh sách comment mà Agent cần trả lời [Agent]
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng comment mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           default: ''
 *         description: Từ khóa tìm kiếm theo nội dung comment hoặc tên người dùng
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [unreplied, replied, all]
 *           default: all
 *         description: Lọc comment theo trạng thái trả lời (unreplied, replied, all)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       403:
 *         description: Lấy danh sách thất bại
 */
router.get(
  '/agent/comments-needing-reply',
  authenticateToken,
  roleGuard([RoleName.Agent]),
  agentReviewController.getCommentsAgentNeedingReply
);

export default router;
