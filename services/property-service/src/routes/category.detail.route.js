import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import categoryDetailService from '../services/category.detail.service.js';

/**
 * @swagger
 * /prop/category/detail:
 *   post:
 *     summary: Tạo mới
 *     tags: [CategoryDetail]
 *     security:
 *       - bearerAuth: []
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
 *               fieldType:
 *                 type: string
 *               fieldPlaceholder:
 *                 type: string
 *               option:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isRequire:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category detail created successfully
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
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  async (req, res) => {
    try {
      const {
        categoryId,
        fieldName,
        fieldType,
        fieldPlaceholder,
        option,
        isActive,
        isRequire,
      } = req.body;
      if (!categoryId || !fieldName || !fieldType) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Missing required fields'],
        });
      }
      const categoryDetail = await categoryDetailService.createCategoryDetail({
        categoryId,
        fieldName,
        fieldType,
        fieldPlaceholder,
        option,
        isActive,
        isRequire,
      });
      return res.status(201).json({
        data: { categoryDetail: categoryDetail },
        message: 'Category detail created successfully',
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

export default router;
