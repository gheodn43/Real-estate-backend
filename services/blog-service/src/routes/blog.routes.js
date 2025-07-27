import express from 'express';
import blogController from '../controllers/blog.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';

const router = express.Router();

/**
 * @swagger
 * /blogs/draft:
 *   get:
 *     summary: Lấy tất cả blog draft (Admin, Journalist)
 *     description: Lấy tất cả blog draft (Admin, Journalist)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy blog draft thành công
 *       500:
 *         description: Lỗi server
 */
router.route('/draft')
  .get(authMiddleware, roleGuard([RoleName.Admin, RoleName.Journalist]), blogController.getBlogDraft);

/**
 * @swagger
 * /blogs/create:
 *   post:
 *     summary: Đăng blog mới tại màn hình thêm mới bấm nút xuất bản [Admin]
 *     description: Chỉ Admin có thể tạo blog với trạng thái published. Journalist không được phép sử dụng endpoint này.
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
 *         description: Blog đã được đăng
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *       403:
 *         description: Không có quyền (chỉ Admin)
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/create',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.createBlog
);

/**
 * @swagger
 * /blogs/save/{blog_id}:
 *   put:
 *     summary: Cập nhật blog tại màn hình cập nhật bấm nút LƯU [Admin, Journalist]
 *     description: Journalist chỉ có thể cập nhật blog ở trạng thái draft, pending, rejected; Admin có thể cập nhật mọi trạng thái. Không cho phép Journalist cập nhật blog published.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blog_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của blog cần cập nhật
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề mới của blog (tùy chọn)
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn mới của blog (tùy chọn)
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết mới của blog (tùy chọn)
 *     responses:
 *       200:
 *         description: Blog đã được cập nhật
 *       400:
 *         description: Thiếu blog_id
 *       403:
 *         description: Không có quyền cập nhật blog (Journalist không được cập nhật blog published)
 *       404:
 *         description: Blog không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put(
  '/save/:blog_id',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.updateBlogContent
);

/**
 * @swagger
 * /blogs/resubmit/{blog_id}:
 *   put:
 *     summary: Gửi lại blog bị từ chối để duyệt [Journalist, Admin]
 *     description: Chuyển trạng thái blog từ rejected sang pending để duyệt lại. Chỉ Journalist sở hữu blog hoặc Admin có thể thực hiện.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blog_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của blog cần gửi lại
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề mới của blog (tùy chọn)
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn mới của blog (tùy chọn)
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết mới của blog (tùy chọn)
 *     responses:
 *       200:
 *         description: Blog đã được gửi lại để duyệt
 *       400:
 *         description: Thiếu blog_id hoặc blog không ở trạng thái rejected
 *       403:
 *         description: Không có quyền gửi lại blog
 *       404:
 *         description: Blog không tồn tại
 *       405:
 *         description: Blog đã được duyệt
 *       500:
 *         description: Lỗi server
 */
router.put(
  '/resubmit/:blog_id',
  authMiddleware,
  roleGuard([RoleName.Journalist, RoleName.Admin]),
  blogController.resubmitBlog
);

/**
 * @swagger
 * /blogs/{blog_id}:
 *   delete:
 *     summary: Xóa blog [Journalist, Admin]
 *     description: Chỉ Journalist sở hữu blog hoặc Admin có thể xóa. Gửi email thông báo khi xóa thành công.
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
 *       400:
 *         description: Thiếu blog_id
 *       403:
 *         description: Không có quyền xóa blog
 *       404:
 *         description: Blog không tồn tại
 *       500:
 *         description: Lỗi server
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
 *     summary: Lấy danh sách blog [All Role]
 *     description: Lấy danh sách các blog có trạng thái published với phân trang.
 *     tags: [Blogs]
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
 *       500:
 *         description: Lỗi server
 */
router.get('/list',blogController.getBlogs);

/**
 * @swagger
 * /blogs/{short_link}:
 *   get:
 *     summary: Lấy chi tiết blog theo short_link [All Role]
 *     description: Lấy chi tiết blog có trạng thái published cùng với bình luận và phản ứng của người dùng.
 *     tags: [Blogs]
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
 *       404:
 *         description: Blog không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.get('/:short_link', blogController.getBlogByShortLink);

/**
 * @swagger
 * /blogs/draft:
 *   post:
 *     summary: Lưu nháp blog tại màn hình thêm mới bấm nút LƯU NHÁP [Journalist, Admin]
 *     description: Tạo blog mới với trạng thái draft.
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
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *       500:
 *         description: Lỗi server
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
 *     summary: Gửi blog để duyệt tại màn hình thêm mới bấm nút GỬI DUYỆT [Journalist]
 *     description: Tạo blog mới với trạng thái pending và gửi thông báo cho Admin.
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
 *       400:
 *         description: Thiếu thông tin bắt buộc (title, description, content)
 *       500:
 *         description: Lỗi server
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
 *     summary: Thêm bình luận cho blog [All Role]
 *     description: Thêm bình luận cho blog với trạng thái published ngay lập tức.
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
 *       400:
 *         description: Thiếu thông tin bình luận
 *       500:
 *         description: Lỗi server
 */
router.post('/review', authMiddleware, blogController.createBlogReview);

/**
 * @swagger
 * /blogs/react:
 *   post:
 *     summary: Like hoặc bỏ like blog [All Role]
 *     description: Thêm hoặc xóa lượt like của người dùng cho blog.
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
 *       200:
 *         description: Đã bỏ like blog
 *       400:
 *         description: Thiếu blog_id
 *       500:
 *         description: Lỗi server
 */
router.post('/react', authMiddleware, blogController.createBlogReact);

/**
 * @swagger
 * /blogs/share:
 *   post:
 *     summary: Chia sẻ blog qua email [All Role]
 *     description: Gửi email chứa thông tin blog đến người nhận.
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
 *       400:
 *         description: Thiếu blog_id hoặc email
 *       500:
 *         description: Lỗi server
 */
router.post('/share', authMiddleware, blogController.shareBlog);

/**
 * @swagger
 * /blogs/publish/{blog_id}:
 *   put:
 *     summary: Đăng blog (Admin)
 *     description: Chuyển trạng thái blog từ draft hoặc rejected sang published. Chỉ Admin có thể thực hiện.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blog_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của blog cần đăng
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề mới của blog (tùy chọn)
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn mới của blog (tùy chọn)
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết mới của blog (tùy chọn)
 *     responses:
 *       200:
 *         description: Blog đã được đăng
 *       400:
 *         description: Thiếu blog_id hoặc blog không ở trạng thái draft/rejected
 *       403:
 *         description: Không có quyền (chỉ Admin)
 *       404:
 *         description: Blog không tồn tại     
 *       500:
 *         description: Lỗi server    
 */
router.put(
  '/publish/:blog_id',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.publishedBlog
);

/**
 * @swagger
 * /blogs/moderate:
 *   post:
 *     summary: Duyệt hoặc từ chối blog (Admin)
 *     description: Chuyển trạng thái blog từ pending sang published (approve) hoặc rejected (reject). Chỉ Admin có thể thực hiện.
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
 *       400:
 *         description: Thiếu blog_id hoặc action không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/moderate',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  blogController.moderateBlog
);

export default router;