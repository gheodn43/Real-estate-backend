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
 *               title:
 *                 type: string
 *                 description: Tiêu đề của blog
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn của blog
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết của blog
 *               small_image:
 *                 type: string
 *                 nullable: true
 *                 description: URL hình ảnh đại diện (tùy chọn)
 *               short_link:
 *                 type: string
 *                 nullable: true
 *                 description: Đường dẫn ngắn của blog (tùy chọn)
 *             required:
 *               - title
 *               - description
 *               - content
 *     responses:
 *       201:
 *         description: Blog đã được đăng hoặc gửi duyệt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được đăng
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu thông tin blog }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.post(
  '/create',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.createBlog
);

/**
 * @swagger
 * /blogs/update:
 *   put:
 *     summary: Cập nhật blog
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog cần cập nhật
 *               title:
 *                 type: string
 *                 description: Tiêu đề mới của blog (tùy chọn)
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn mới của blog (tùy chọn)
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết mới của blog (tùy chọn)
 *               small_image:
 *                 type: string
 *                 nullable: true
 *                 description: URL hình ảnh đại diện mới (tùy chọn)
 *               short_link:
 *                 type: string
 *                 nullable: true
 *                 description: Đường dẫn ngắn mới của blog (tùy chọn)
 *             required:
 *               - blog_id
 *     responses:
 *       200:
 *         description: Blog đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được cập nhật
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.put(
  '/update',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.updateBlog
);

/**
 * @swagger
 * /blogs/resubmit:
 *   post:
 *     summary: Gửi lại blog bị từ chối để duyệt [Journalist, Admin]
 *     description: Chuyển trạng thái blog từ rejected sang pending để duyệt lại. Chỉ journalist sở hữu blog hoặc admin có thể thực hiện.
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog cần gửi lại
 *             required:
 *               - blog_id
 *     responses:
 *       200:
 *         description: Blog đã được gửi lại để duyệt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được gửi lại để duyệt
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id, blog không ở trạng thái rejected, hoặc user không có quyền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog phải ở trạng thái rejected để gửi lại }
 *                 errors: { type: array, items: { type: string } }
 *       404:
 *         description: Blog không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog không tồn tại }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.post(
  '/resubmit',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.resubmitBlog
);

/**
 * @swagger
 * /blogs/{blog_id}:
 *   delete:
 *     summary: Xóa blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blog_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của blog cần xóa
 *     responses:
 *       200:
 *         description: Blog đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: object
 *                       properties:
 *                         message: { type: string, example: Blog deleted successfully }
 *                 message:
 *                   type: string
 *                   example: Blog đã được xóa
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id }
 *                 errors: { type: array, items: { type: string } }
 *       403:
 *         description: Không có quyền xóa blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Không có quyền xóa blog }
 *                 errors: { type: array, items: { type: string } }
 *       404:
 *         description: Blog không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog không tồn tại }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.delete(
  '/:blog_id',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.deleteBlog
);

/**
 * @swagger
 * /blogs/list:
 *   get:
 *     summary: Lấy danh sách blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số blog mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blogs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           description: { type: string }
 *                           small_image: { type: string }
 *                           short_link: { type: string }
 *                           hasReacted: { type: boolean }
 *                           reactCount: { type: integer }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalItems: { type: integer }
 *                         itemsPerPage: { type: integer }
 *                 message:
 *                   type: string
 *                   example: Danh sách blog đã được lấy thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.get('/list', authMiddleware, blogController.getBlogs);

/**
 * @swagger
 * /blogs/{short_link}:
 *   get:
 *     summary: Lấy chi tiết blog theo short_link
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: short_link
 *         schema:
 *           type: string
 *         required: true
 *         description: Đường dẫn ngắn của blog
 *       - in: query
 *         name: commentPage
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang của bình luận
 *       - in: query
 *         name: commentLimit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bình luận mỗi trang
 *     responses:
 *       200:
 *         description: Chi tiết blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         hasReacted: { type: boolean }
 *                         reactCount: { type: integer }
 *                         comments:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: integer }
 *                               comment: { type: string }
 *                               user_id: { type: integer }
 *                               user_name: { type: string }
 *                               created_at: { type: string }
 *                     commentPagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalItems: { type: integer }
 *                         itemsPerPage: { type: integer }
 *                 message:
 *                   type: string
 *                   example: Chi tiết blog đã được lấy thành công
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Blog không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog không tồn tại }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.get('/:short_link', authMiddleware, blogController.getBlogByShortLink);

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
 *               title:
 *                 type: string
 *                 description: Tiêu đề của blog
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn của blog
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết của blog
 *               small_image:
 *                 type: string
 *                 nullable: true
 *                 description: URL hình ảnh đại diện (tùy chọn)
 *               short_link:
 *                 type: string
 *                 nullable: true
 *                 description: Đường dẫn ngắn của blog (tùy chọn)
 *             required:
 *               - title
 *               - description
 *               - content
 *     responses:
 *       201:
 *         description: Blog đã được lưu nháp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được lưu nháp
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu thông tin blog }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
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
 *               title:
 *                 type: string
 *                 description: Tiêu đề của blog
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn của blog
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết của blog
 *               small_image:
 *                 type: string
 *                 nullable: true
 *                 description: URL hình ảnh đại diện (tùy chọn)
 *               short_link:
 *                 type: string
 *                 nullable: true
 *                 description: Đường dẫn ngắn của blog (tùy chọn)
 *             required:
 *               - title
 *               - description
 *               - content
 *     responses:
 *       201:
 *         description: Blog đã được gửi duyệt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được gửi duyệt
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu thông tin blog }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog
 *               comment:
 *                 type: string
 *                 description: Nội dung bình luận
 *             required:
 *               - blog_id
 *               - comment
 *     responses:
 *       201:
 *         description: Bình luận đã được thêm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         blog_id: { type: integer }
 *                         user_id: { type: integer }
 *                         comment: { type: string }
 *                         parent_id: { type: integer }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Bình luận đã được thêm
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu thông tin bình luận
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu thông tin bình luận }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.post('/review', authMiddleware, blogController.createBlogReview);

/**
 * @swagger
 * /blogs/react:
 *   post:
 *     summary: Like hoặc bỏ like blog
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog
 *             required:
 *               - blog_id
 *     responses:
 *       201:
 *         description: Đã like blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         blog_id: { type: integer }
 *                         user_id: { type: integer }
 *                         created_at: { type: string }
 *                 message:
 *                   type: string
 *                   example: Đã like blog
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       200:
 *         description: Đã bỏ like blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: object
 *                       properties:
 *                         message: { type: string, example: React removed successfully }
 *                 message:
 *                   type: string
 *                   example: Đã bỏ like blog
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog
 *               email:
 *                 type: string
 *                 description: Email người nhận
 *             required:
 *               - blog_id
 *               - email
 *     responses:
 *       200:
 *         description: Blog đã được chia sẻ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: object
 *                       properties:
 *                         message: { type: string, example: Blog đã được chia sẻ qua email }
 *                 message:
 *                   type: string
 *                   example: Blog đã được chia sẻ qua email
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id hoặc email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id hoặc email }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog
 *             required:
 *               - blog_id
 *     responses:
 *       200:
 *         description: Blog đã được đăng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được đăng
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.post(
  '/publish',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.publishBlog
);

/**
 * @swagger
 * /blogs/moderate:
 *   post:
 *     summary: Duyệt hoặc từ chối blog (admin)
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
 *               blog_id:
 *                 type: integer
 *                 description: ID của blog
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Hành động (approve hoặc reject)
 *             required:
 *               - blog_id
 *               - action
 *     responses:
 *       200:
 *         description: Blog đã được duyệt hoặc từ chối
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         journalist_Id: { type: integer }
 *                         title: { type: string }
 *                         description: { type: string }
 *                         content: { type: string }
 *                         small_image: { type: string }
 *                         short_link: { type: string }
 *                         status: { type: string }
 *                 message:
 *                   type: string
 *                   example: Blog đã được duyệt
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id hoặc action không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Thiếu blog_id hoặc action không hợp lệ }
 *                 errors: { type: array, items: { type: string } }
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Lỗi server }
 *                 errors: { type: array, items: { type: string } }
 */
router.post(
  '/moderate',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.moderateBlog
);

export default router;