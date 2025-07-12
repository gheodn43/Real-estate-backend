import express from 'express';
import blogController from '../controllers/blog.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';

const router = express.Router();

/**
 * @swagger
 * /blogs/create:
 *   post:
 *     summary: Đăng blog mới [Admin]
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
router.post(
  '/create',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.createBlog
);

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
router.post(
  '/draft',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.saveDraftBlog
);

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
router.post(
  '/submit',
  authMiddleware,
  roleGuard([RoleName.Journalist]),
  blogController.submitBlogForReview
);

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
router.post('/review', authMiddleware, blogController.createBlogReview);

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
router.post('/react', authMiddleware, blogController.createBlogReact);

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
router.post('/share', authMiddleware, blogController.shareBlog);

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
router.post(
  '/publish',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.publishBlog
);

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
router.post(
  '/approve',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.approveBlog
);

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
router.post(
  '/reject',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.rejectBlog
);

export default router;
