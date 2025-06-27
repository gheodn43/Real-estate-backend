import express from 'express';
import agentReviewController from '../controllers/agentReview.controller.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

/**
 * @swagger
 * /agent-reviews:
 *   post:
 *     summary: Tạo đánh giá mới cho Agent
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Đánh giá được tạo thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Tạo đánh giá thất bại (ví dụ: review đã tồn tại)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Tạo đánh giá thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Đánh giá đã tồn tại]
 */
router.post('/', authenticateToken, roleGuard([RoleName.Customer, RoleName.Admin]), agentReviewController.createReview);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Đánh giá được cập nhật thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Cập nhật thất bại (ví dụ: review đã bị xóa hoặc không có quyền)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Cập nhật đánh giá thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Đánh giá đã bị xóa hoặc không có quyền]
 */
router.put(
  '/:id',
  authenticateToken,
  roleGuard([RoleName.Customer, RoleName.Admin]),
  agentReviewController.updateReview,
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
 *         description: Tạo rep-comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Trả lời được tạo thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Tạo rep-comment thất bại (ví dụ: không có quyền)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Tạo trả lời thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Không có quyền]
 */
router.post(
  '/:id/reply',
  authenticateToken,
  roleGuard([RoleName.Agent]),
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
 *         description: Xóa đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Đánh giá được xóa thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Xóa thất bại (ví dụ: không có quyền)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Xóa đánh giá thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Không có quyền]
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
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đánh giá thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Lấy danh sách thất bại (ví dụ: thiếu agent_id)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đánh giá thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Thiếu agent_id]
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
 *         description: Lấy tổng kết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy tổng kết đánh giá thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Lấy tổng kết thất bại (ví dụ: thiếu agent_id)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy tổng kết đánh giá thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Thiếu agent_id]
 */
router.get('/summary', agentReviewController.getAgentReviewSummary);

/**
 * @swagger
 * /agent-reviews/{agent_id}/user:
 *   get:
 *     summary: Lấy danh sách đánh giá của user hiện tại với Agent
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của Agent
 *     responses:
 *       200:
 *         description: Lấy danh sách đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           agent_id:
 *                             type: integer
 *                           user_id:
 *                             type: integer
 *                           rating:
 *                             type: integer
 *                           comment:
 *                             type: string
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           type:
 *                             type: string
 *                             enum: [comment]
 *                           status:
 *                             type: string
 *                             enum: [showing, deleted]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đánh giá của người dùng thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Lấy danh sách đánh giá thất bại (ví dụ: token không hợp lệ hoặc lỗi database)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đánh giá của người dùng thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Token không hợp lệ]
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
 *     summary: Admin duyệt rep-comment
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
 *         description: Duyệt rep-comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Trả lời được duyệt thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       400:
 *         description: 'Duyệt thất bại (ví dụ: reply không tồn tại)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Duyệt trả lời thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Trả lời không tồn tại]
 *       403:
 *         description: Không có quyền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Không có quyền
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Không có quyền]
 */
router.put(
  '/:id/approve',
  authenticateToken,
  roleGuard([RoleName.Admin]),
  agentReviewController.approveReply
);

/**
 * @swagger
 * /agent-reviews/{id}/reject:
 *   put:
 *     summary: Admin từ chối rep-comment
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
 *         description: Từ chối rep-comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Trả lời bị từ chối thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       400:
 *         description: 'Từ chối thất bại (ví dụ: reply không tồn tại)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Từ chối trả lời thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Trả lời không tồn tại]
 *       403:
 *         description: Không có quyền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Không có quyền
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Không có quyền]
 */
router.put(
  '/:id/reject',
  authenticateToken,
  roleGuard([RoleName.Admin]),
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
 *         description: Tạo admin reply thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Trả lời của admin được tạo thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       403:
 *         description: 'Tạo admin reply thất bại (ví dụ: không có quyền)'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Tạo trả lời của admin thất bại
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Không có quyền]
 */
router.post(
  '/:id/admin-reply',
  authenticateToken,
  roleGuard([RoleName.Admin]),
  agentReviewController.adminReply
);

/**
 * @swagger
 * /agent-reviews/pending-replies:
 *   get:
 *     summary: Admin lấy danh sách rep-comment cần phê duyệt
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách trả lời đang chờ phê duyệt thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 */
router.get(
  '/pending-replies',
  authenticateToken,
  roleGuard([RoleName.Admin]),
  agentReviewController.getPendingReplies
);

/**
 * @swagger
 * /agent-reviews/my-replies:
 *   get:
 *     summary: Agent xem danh sách rep-comment của mình
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, showing, rejected]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách trả lời của tôi thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 */
router.get(
  '/my-replies',
  authenticateToken,
  roleGuard([RoleName.Agent]),
  agentReviewController.getMyReplies
);

export default router;