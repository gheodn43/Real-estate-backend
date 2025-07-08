import express from 'express';
import * as blogController from '../controllers/blog.controller';
import authenticateToken from '../middleware/authenticateToken';
import roleGuard, { RoleName } from '../middleware/roleGuard';

const router = express.Router();

/**
 * @swagger
 * /blogs/create:
 *   post:
 *     summary: Đăng blog mới
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               content: { type: string }
 *               small_image: { type: string }
 *               short_link: { type: string }
 *     responses:
 *       201: { description: Blog đã được đăng }
 *       400: { description: Thiếu thông tin }
 */
router.post('/create', roleGuard([RoleName.Journalist, RoleName.Admin]), authenticateToken, blogController.createBlog);

/**
 * @swagger
 * /blogs/draft:
 *   post:
 *     summary: Lưu nháp blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               content: { type: string }
 *               small_image: { type: string }
 *               short_link: { type: string }
 *     responses:
 *       201: { description: Blog đã được lưu nháp }
 *       400: { description: Thiếu thông tin }
 */
router.post('/draft', roleGuard([RoleName.Journalist, RoleName.Admin]), authenticateToken, blogController.saveDraftBlog);

/**
 * @swagger
 * /blogs/submit:
 *   post:
 *     summary: Gửi blog để duyệt
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               content: { type: string }
 *               small_image: { type: string }
 *               short_link: { type: string }
 *     responses:
 *       201: { description: Blog đã được gửi duyệt }
 *       400: { description: Thiếu thông tin }
 */
router.post('/submit', roleGuard([RoleName.Journalist]), authenticateToken, blogController.submitBlogForReview);

/**
 * @swagger
 * /blogs/review:
 *   post:
 *     summary: Thêm bình luận cho blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Bình luận đã được thêm }
 *       400: { description: Thiếu thông tin }
 */
router.post('/review', authenticateToken, blogController.createBlogReview);

/**
 * @swagger
 * /blogs/react:
 *   post:
 *     summary: Like blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *     responses:
 *       201: { description: Đã like blog }
 *       400: { description: Thiếu blog_id }
 */
router.post('/react', authenticateToken, blogController.createBlogReact);

/**
 * @swagger
 * /blogs/share:
 *   post:
 *     summary: Chia sẻ blog qua email
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *               email: { type: string }
 *     responses:
 *       200: { description: Blog đã được chia sẻ }
 *       400: { description: Thiếu blog_id hoặc email }
 */
router.post('/share', authenticateToken, blogController.shareBlog);

/**
 * @swagger
 * /blogs/publish:
 *   post:
 *     summary: Đăng blog (admin)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *     responses:
 *       200: { description: Blog đã được đăng }
 *       400: { description: Thiếu blog_id }
 */
router.post('/publish', roleGuard([RoleName.Admin]), authenticateToken, blogController.publishBlog);

/**
 * @swagger
 * /blogs/approve:
 *   post:
 *     summary: Duyệt blog (admin)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *     responses:
 *       200: { description: Blog đã được duyệt }
 *       400: { description: Thiếu blog_id }
 */
router.post('/approve', roleGuard([RoleName.Admin]), authenticateToken, blogController.approveBlog);

/**
 * @swagger
 * /blogs/reject:
 *   post:
 *     summary: Từ chối blog (admin)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id: { type: integer }
 *     responses:
 *       200: { description: Blog đã bị từ chối }
 *       400: { description: Thiếu blog_id }
 */
router.post('/reject', roleGuard([RoleName.Admin]), authenticateToken, blogController.rejectBlog);

export default router;