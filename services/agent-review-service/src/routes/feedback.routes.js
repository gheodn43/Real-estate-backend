import { Router } from 'express';
import FeedbackController from '../controllers/feedback.controller.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';

const router = Router();

/**
 * @swagger
 * /review/feedback:
 *   post:
 *     summary: Tạo mới phản hồi từ khách hàng [Customer]
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, email, number_phone, message]
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: Tên của khách hàng
 *                 example: Van A
 *               last_name:
 *                 type: string
 *                 description: Họ của khách hàng (tùy chọn)
 *                 example: Nguyen
 *               address:
 *                 type: string
 *                 description: Địa chỉ của khách hàng (tùy chọn)
 *                 example: 123 Đường Láng
 *               city:
 *                 type: string
 *                 description: Thành phố của khách hàng (tùy chọn)
 *                 example: Hà Nội
 *               email:
 *                 type: string
 *                 description: Email của khách hàng
 *                 example: vana@example.com
 *               number_phone:
 *                 type: string
 *                 description: Số điện thoại của khách hàng
 *                 example: +84987654321
 *               message:
 *                 type: string
 *                 description: Nội dung phản hồi
 *                 example: Dịch vụ rất tốt, tôi rất hài lòng!
 *     responses:
 *       201:
 *         description: Phản hồi được tạo thành công
 *       400:
 *         description: Thiếu hoặc dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền (yêu cầu role customer)
 */
router.post('/', FeedbackController.createFeedback);

/**
 * @swagger
 * /review/feedback:
 *   get:
 *     summary: Lấy danh sách phản hồi [Admin], không bao gồm hidden)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang số
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_responded, responded]
 *         description: Lọc theo trạng thái (tùy chọn, mặc định không bao gồm hidden)
 *         example: not_responded
 *     responses:
 *       200:
 *         description: Danh sách phản hồi
 *       400:
 *         description: Lỗi tham số
 *       403:
 *         description: Không có quyền (yêu cầu role admin)
 */
router.get('/', authenticateToken, roleGuard([RoleName.Admin]), FeedbackController.getAllFeedback);

/**
 * @swagger
 * /review/feedback/responded:
 *   get:
 *     summary: Lấy danh sách phản hồi đã được trả lời [All role]
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang số
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *         example: 10
 *     responses:
 *       200:
 *         description: Danh sách phản hồi đã trả lời
 *       400:
 *         description: Lỗi tham số
 *       403:
 *         description: Không có quyền
 */
router.get('/responded', FeedbackController.getRespondedFeedback);

/**
 * @swagger
 * /review/feedback/{id}:
 *   get:
 *     summary: Xem chi tiết một phản hồi [Admin]
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phản hồi
 *         example: 1
 *     responses:
 *       200:
 *         description: Chi tiết phản hồi
 *       404:
 *         description: Không tìm thấy phản hồi
 *       403:
 *         description: Không có quyền (yêu cầu role admin)
 */
router.get('/:id', authenticateToken, roleGuard([RoleName.Admin]), FeedbackController.getFeedbackById);

/**
 * @swagger
 * /review/feedback/{id}/reply:
 *   put:
 *     summary: Admin trả lời một phản hồi [Admin]
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phản hồi
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [response]
 *             properties:
 *               response:
 *                 type: string
 *                 description: Nội dung trả lời của admin
 *                 example: Cảm ơn phản hồi của bạn! Chúng tôi sẽ cải thiện dịch vụ.
 *     responses:
 *       200:
 *         description: Trả lời thành công
 *       400:
 *         description: Lỗi dữ liệu
 *       404:
 *         description: Không tìm thấy phản hồi
 *       403:
 *         description: Không có quyền (yêu cầu role admin)
 */
router.put('/:id/reply', authenticateToken, roleGuard([RoleName.Admin]), FeedbackController.replyFeedback);


/**
 * @swagger
 * /review/feedback/{id}/hide:
 *   put:
 *     summary: Admin ẩn một phản hồi [Admin]
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phản hồi
 *         example: 1
 *     responses:
 *       200:
 *         description: Ẩn phản hồi thành công
 *       404:
 *         description: Không tìm thấy phản hồi
 *       403:
 *         description: Không có quyền (yêu cầu role admin)
 */
router.put('/:id/hide', authenticateToken, roleGuard([RoleName.Admin]), FeedbackController.hideFeedback);

export default router;