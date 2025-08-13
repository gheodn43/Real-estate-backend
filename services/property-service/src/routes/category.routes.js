import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import categoryService from '../services/category.service.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';

/**
 * @swagger
 * /prop/category:
 *   post:
 *     summary: Tạo mới category ['ADMIN']
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [assets, needs]
 *                 description: Loại category (assets hoặc needs)
 *               parentCategoryId:
 *                 type: int
 *                 description: ID của category cha (nếu có)
 *               name:
 *                 type: string
 *                 description: Tên category
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái category
 *                 default: true
 *     responses:
 *       201:
 *         description: Category được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { type, parentCategoryId, name, isActive } = req.body;
      if (!type || !name) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Missing required fields'],
        });
      }
      const category = await categoryService.createCategory({
        type,
        parentCategoryId,
        name,
        isActive,
      });
      return res.status(201).json({
        data: { category: category },
        message: 'Category created successfully',
        error: [],
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: '',
        error: [error.message],
      });
    }
  });

/**
 * @swagger
 * /prop/category/{id}:
 *   put:
 *     summary: Cập nhật category ['ADMIN']
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentCategoryId:
 *                 type: int
 *                 description: ID của category cha (nếu có)
 *               name:
 *                 type: string
 *                 description: Tên category
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái category
 *     responses:
 *       200:
 *         description: Category được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy category
 *       500:
 *         description: Lỗi server
 */
router
  .route('/:id')
  .put(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const { parentCategoryId, name, isActive } = req.body;

      const category = await categoryService.updateCategory(parseInt(id), {
        parentCategoryId,
        name,
        isActive,
      });

      if (!category) {
        return res.status(404).json({
          data: null,
          message: '',
          error: ['Category not found'],
        });
      }

      return res.status(200).json({
        data: { category },
        message: 'Category updated successfully',
        error: [],
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        message: '',
        error: [error.message],
      });
    }
  });
/**
 * @swagger
 * /prop/category/{id}:
 *   get:
 *     summary: Lấy thông tin của một category ['ADMIN']
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của category
 *     responses:
 *       200:
 *         description: Lấy thông tin category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         type:
 *                           type: string
 *                           enum: [assets, needs]
 *                         parentCategoryId:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                 message:
 *                   type: string
 *                   example: Get category successfully
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy category
 *       500:
 *         description: Lỗi server
 */
router.route('/:id').get(authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(parseInt(id));

    if (!category) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Category not found'],
      });
    }

    return res.status(200).json({
      data: { category },
      message: 'Get category successfully',
      error: [],
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      message: '',
      error: [error.message],
    });
  }
});

/**
 * @swagger
 * /prop/category/by-type/{type}:
 *   get:
 *     summary: Lấy danh sách category theo type ['ADMIN']
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [assets, needs]
 *         description: Loại category (assets hoặc needs)
 *     responses:
 *       200:
 *         description: Lấy danh sách category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                             enum: [assets, needs]
 *                           parentCategoryId:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                 message:
 *                   type: string
 *                   example: Get categories successfully
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Loại category không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/by-type/:type')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      try {
        const { type } = req.params;
        if (!['assets', 'needs'].includes(type)) {
          return res.status(400).json({
            data: null,
            message: '',
            error: ['Invalid category type'],
          });
        }

        const categories = await categoryService.getCategoryByType(type);

        return res.status(200).json({
          data: { categories },
          message: 'Get categories successfully',
          error: [],
        });
      } catch (error) {
        return res.status(500).json({
          data: null,
          message: '',
          error: [error.message],
        });
      }
    }
  );

/**
 * @swagger
 * /prop/category/active-by-type/{type}:
 *   get:
 *     summary: Lấy danh sách category đang active theo type [ALL ROLES]
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [assets, needs]
 *         description: Loại category (assets hoặc needs)
 *     responses:
 *       200:
 *         description: Lấy danh sách category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                             enum: [assets, needs]
 *                           parentCategoryId:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                 message:
 *                   type: string
 *                   example: Get categories successfully
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Loại category không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.route('/active-by-type/:type').get(async (req, res) => {
  try {
    const { type } = req.params;
    let categories = [];
    if (!['assets', 'needs'].includes(type)) {
      return res.status(400).json({
        data: null,
        message: '',
        error: ['Invalid category type'],
      });
    }
    if (type === 'assets') {
      categories = await categoryService.getCategoryAssetsIncludeCount(type);
    } else {
      categories = await categoryService.getCategoryNeeds();
    }
    return res.status(200).json({
      data: { categories },
      message: 'Get categories successfully',
      error: [],
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      message: '',
      error: [error.message],
    });
  }
});

// delete soft
/**
 * @swagger
 * /prop/category/soft-delete/{id}:
 *   put:
 *     summary: Xóa mềm category [ADMIN]
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của category
 *     responses:
 *       200:
 *         description: Xóa mềm category thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/soft-delete/:id')
  .put(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const category = await categoryService.softDeleteCategory(id);
      return res.status(200).json({
        data: { category },
        message: 'Delete category successfully',
        error: [],
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: '',
        error: [error.message],
      });
    }
  });

export default router;
