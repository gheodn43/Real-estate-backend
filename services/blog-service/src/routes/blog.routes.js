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
 *                           journalist_Id: { type: integer }
 *                           title: { type: string }
 *                           description: { type: string }
 *                           content: { type: string }
 *                           small_image: { type: string }
 *                           short_link: { type: string }
 *                           status: { type: string, example: draft }
 *                 message:
 *                   type: string
 *                   example: Lấy blog draft thành công
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
 * 
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
 *                         status: { type: string, example: published }
 *                 message:
 *                   type: string
 *                   example: Bài viết đã được đăng
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
 *       403:
 *         description: Không có quyền (chỉ Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Only Admin can create published blogs }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     journalist_Id: { type: integer }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     content: { type: string }
 *                     small_image: { type: string }
 *                     short_link: { type: string }
 *                     status: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
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
 *       403:
 *         description: Không có quyền cập nhật blog (Journalist không được cập nhật blog published)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Không có quyền cập nhật blog }
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
 *                         status: { type: string, example: pending }
 *                 message:
 *                   type: string
 *                   example: Blog đã được gửi lại để duyệt
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id hoặc blog không ở trạng thái rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog phải ở trạng thái rejected để gửi lại }
 *                 errors: { type: array, items: { type: string } }
 *       403:
 *         description: Không có quyền gửi lại blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Không có quyền gửi lại blog }
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
 *                         status: { type: string, example: draft }
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
 *                         status: { type: string, example: pending }
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
 *                         status: { type: string, example: published }
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
 *                         status: { type: string, example: published }
 *                 message:
 *                   type: string
 *                   example: Blog đã được đăng
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Thiếu blog_id hoặc blog không ở trạng thái draft/rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Blog must be in draft or rejected status to publish }
 *                 errors: { type: array, items: { type: string } }
 *       403:
 *         description: Không có quyền (chỉ Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: null }
 *                 message: { type: string, example: Chỉ Admin có quyền đăng blog }
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
 *                         status: { type: string, example: published hoặc rejected }
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