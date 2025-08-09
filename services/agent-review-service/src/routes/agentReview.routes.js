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
router.post('/', authenticateToken, roleGuard([RoleName.Customer, RoleName.Admin]), agentReviewController.createReview);

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
  agentReviewController.updateReview,
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
 *     responses:
 *       200:
 *         description: Lấy danh sách và tổng kết thành công
 *       403:
 *         description: Lấy danh sách và tổng kết thất bại
 */
router.get('/', agentReviewController.getAgentReviews);

/**
 * @swagger
 * /review/agent-reviews/{agent_id}/user:

 *   get:
 *     summary: Lấy danh sách đánh giá của user hiện tại với Agent [Customer]
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
 */
router.get(
  '/:agent_id/user',
  authenticateToken,
  agentReviewController.getUserReview
);

/**
 * @swagger
 * /review/agent-reviews/{id}/action:

 *   put:
 *     summary: Admin thực hiện hành động duyệt hoặc từ chối rep-comment
 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của rep-comment
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [approve, reject]
 *         description: Hành động cần thực hiện (approve hoặc reject)
 *     responses:
 *       200:
 *         description: Hành động thực hiện thành công
 *       400:
 *         description: 'Hành động thất bại (ví dụ: rep-comment không tồn tại hoặc hành động không hợp lệ)'
 *       403:
 *         description: 'Không có quyền'
 */
router.put(
  '/:id/action',
  authenticateToken,
  roleGuard([RoleName.Admin]),
  agentReviewController.handleReviewAction
);

/**
 * @swagger
 * /review/agent-reviews/pending-replies:

 *   get:
 *     summary: Admin lấy danh sách rep-comment cần phê duyệt [Admin]

 *     tags: [AgentReview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  '/pending-replies',
  authenticateToken,
  roleGuard([RoleName.Admin]),
  agentReviewController.getPendingReplies
);

/**
 * @swagger
 * /review/agent-reviews/my-replies:

 *   get:
 *     summary: Agent xem danh sách rep-comment của mình [Agent]
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
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  '/my-replies',
  authenticateToken,
  roleGuard([RoleName.Agent]),
  agentReviewController.getMyReplies
);

export default router;