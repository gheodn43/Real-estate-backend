import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import categoryDetailService from '../services/category.detail.service.js';

/**
 * @swagger
 * /prop/category/detail:
 *   post:
 *     summary: Tạo mới các trường chi tiết cho một hoặc nhiều category [ADMIN]
 *     tags: [CategoryDetail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *               - fieldName
 *               - fieldType
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Mảng các ID của danh mục cần thêm field chi tiết
 *               fieldName:
 *                 type: string
 *               icon:
 *                 type: string
 *               fieldType:
 *                 type: string
 *                 enum: [number, text, select, date, boolean]
 *               fieldPlaceholder:
 *                 type: string
 *               option:
 *                 type: string
 *               unit:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isRequire:
 *                 type: boolean
 *               isShowing:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           categoryId:
 *                             type: integer
 *                           fieldName:
 *                             type: string
 *                           icon:
 *                             type: string
 *                           fieldType:
 *                             type: string
 *                           fieldPlaceholder:
 *                             type: string
 *                           option:
 *                             type: string
 *                           unit:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           isRequire:
 *                             type: boolean
 *                           isShowing:
 *                             type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing or invalid required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router
  .route('/')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const {
        categoryIds,
        fieldName,
        icon,
        fieldType,
        fieldPlaceholder,
        option,
        unit,
        isActive,
        isRequire,
        isShowing,
      } = req.body;

      if (
        !Array.isArray(categoryIds) ||
        categoryIds.length === 0 ||
        !fieldName ||
        !fieldType
      ) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Missing or invalid required fields'],
        });
      }

      const createdDetails = await Promise.all(
        categoryIds.map((categoryId) =>
          categoryDetailService.createDetail({
            categoryId,
            fieldName,
            icon,
            fieldType,
            fieldPlaceholder,
            option,
            unit,
            isActive,
            isRequire,
            isShowing,
          })
        )
      );

      return res.status(201).json({
        data: { categoryDetails: createdDetails },
        message: 'Category details created successfully',
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
 * /prop/category/detail/{id}:
 *   get:
 *     summary: Lấy thông tin của một trường chi tiết theo id [ALL ROLES]
 *     tags: [CategoryDetail]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category detail updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryDetail:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         categoryId:
 *                           type: integer
 *                         fieldName:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         fieldType:
 *                           type: string
 *                         fieldPlaceholder:
 *                           type: string
 *                         option:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         isRequire:
 *                           type: boolean
 *                         isShowing:
 *                           type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category detail not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id').get(async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDetail = await categoryDetailService.getDetailById(id);
    if (!categoryDetail) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Category detail not found'],
      });
    }
    return res.status(200).json({
      data: { categoryDetail: categoryDetail },
      message: 'Category detail found successfully',
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
 * /prop/category/detail/by-category/{id}:
 *   get:
 *     summary: Lấy danh sách các trường chi tiết trong 1 category [ADMIN]
 *     tags: [CategoryDetail]
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
 *         description: Category detail found successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category detail not found
 *       500:
 *         description: Internal server error
 */
router
  .route('/by-category/:id')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const { category, details } =
        await categoryDetailService.getDetailByCategoryId(id);
      if (!category) {
        return res.status(404).json({
          data: null,
          message: '',
          error: ['Category detail not found'],
        });
      }
      return res.status(200).json({
        data: {
          currentCategory: category,
          categoryDetail: details,
        },
        message: 'Category detail found successfully',
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
 * /prop/category/detail/{id}:
 *   put:
 *     summary: Cập nhật thông tin của một trường chi tiết theo id [ADMIN]
 *     tags: [CategoryDetail]
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
 *               categoryId:
 *                 type: integer
 *               fieldName:
 *                 type: string
 *               icon:
 *                 type: string
 *               fieldType:
 *                 type: string
 *                 enum: [number, text, select, date, boolean]
 *               fieldPlaceholder:
 *                 type: string
 *               option:
 *                 type: string
 *               unit:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isRequire:
 *                 type: boolean
 *               isShowing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category detail updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryDetail:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         categoryId:
 *                           type: integer
 *                         fieldName:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         fieldType:
 *                           type: string
 *                         fieldPlaceholder:
 *                           type: string
 *                         option:
 *                           type: string
 *                         unit:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         isRequire:
 *                           type: boolean
 *                         isShowing:
 *                           type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category detail not found
 *       500:
 *         description: Internal server error
 */
router
  .route('/:id')
  .put(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const {
        categoryId,
        fieldName,
        icon,
        fieldType,
        fieldPlaceholder,
        option,
        unit,
        isActive,
        isRequire,
        isShowing,
      } = req.body;
      const categoryDetail = await categoryDetailService.updateDetail(id, {
        categoryId,
        fieldName,
        fieldType,
        fieldPlaceholder,
        icon,
        option,
        unit,
        isActive,
        isRequire,
        isShowing,
      });
      return res.status(200).json({
        data: { categoryDetail: categoryDetail },
        message: 'Category detail updated successfully',
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
 * /prop/category/detail/soft-delete/{id}:
 *   put:
 *     summary: Xóa thông tin của một trường chi tiết theo id [ADMIN]
 *     tags: [CategoryDetail]
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
 *         description: Category detail deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryDetail:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         categoryId:
 *                           type: integer
 *                         fieldName:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         fieldType:
 *                           type: string
 *                         fieldPlaceholder:
 *                           type: string
 *                         option:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         isRequire:
 *                           type: boolean
 *                         isShowing:
 *                           type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category detail not found
 *       500:
 *         description: Internal server error
 */
router
  .route('/soft-delete/:id')
  .put(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const categoryDetail = await categoryDetailService.softDeleteDetail(id);
      return res.status(200).json({
        data: { categoryDetail: categoryDetail },
        message: 'Category detail deleted successfully',
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
 * /prop/category/detail/active-by-category/{id}:
 *   get:
 *     summary: Lấy danh sách các trường chi tiết trong 1 category [ALL ROLES]
 *     tags: [CategoryDetail]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category detail found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryDetail:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         categoryId:
 *                           type: integer
 *                         fieldName:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         fieldType:
 *                           type: string
 *                         fieldPlaceholder:
 *                           type: string
 *                         option:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         isRequire:
 *                           type: boolean
 *                         isShowing:
 *                           type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category detail not found
 *       500:
 *         description: Internal server error
 */
router.route('/active-by-category/:id').get(async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDetail =
      await categoryDetailService.getActiveDetailByCategoryId(id);
    if (!categoryDetail) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Category detail not found'],
      });
    }
    return res.status(200).json({
      data: { categoryDetail: categoryDetail },
      message: 'Category detail found successfully',
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
