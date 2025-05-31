import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import amentityService from '../services/amentity.service.js';

/**
 * @swagger
 * /prop/amenity:
 *   post:
 *     summary: Giới hạn chỉ tạo được 2 cấp [ADMIN]
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentAmenityId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Amenity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     amenity:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                         parent_amentity_id:
 *                           type: integer
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
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
router
  .route('/')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { name, parentAmenityId, isActive } = req.body;
      if (!name) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Field "name" is required'],
        });
      }
      const amenity = await amentityService.createAmenity({
        name,
        parentAmenityId,
        isActive,
      });
      return res.status(201).json({
        data: { amenity: amenity },
        message: 'Amenity created successfully',
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
 * /prop/amenity/active:
 *   get:
 *     summary: Lấy danh sách amenity active [ALL ROLES]
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: Amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.route('/active').get(async (req, res) => {
  try {
    const amenities = await amentityService.getActiveAmenities();
    if (!amenities) {
      return res.status(404).json({
        data: null,
        message: 'Amenity not found',
        error: [],
      });
    }
    return res.status(200).json({
      data: {
        amenities: amenities,
      },
      message: 'Amenity retrieved successfully',
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
 * /prop/amenity/{id}:
 *   get:
 *     summary: Lấy thông tin của 1 amenity theo id [ADMIN]
 *     tags: [Amenities]
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
 *         description: Amenity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     amenity:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                         parent_amentity_id:
 *                           type: integer
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         children_count:
 *                           type: integer
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Amenity not found
 *       500:
 *         description: Internal server error
 */
router
  .route('/:id')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const amenity = await amentityService.getAmenityById(id);
      if (!amenity) {
        return res.status(404).json({
          data: null,
          message: 'Amenity not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: { amenity: amenity },
        message: 'Amenity retrieved successfully',
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
 * /prop/amenity/of-parent/{id}:
 *   get:
 *     summary: Lấy danh sách amenity con của 1 amenity cha theo id [ADMIN]
 *     tags: [Amenities]
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
 *         description: Amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     parent:
 *                       type: object
 *                     children:
 *                       type: arra
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Amenity not found or has no children
 *       500:
 *         description: Internal server error
 */
router
  .route('/of-parent/:id')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const amenities = await amentityService.getAmenitiesByParentId(id);
      if (!amenities.parent) {
        return res.status(404).json({
          data: null,
          message: 'Amenity not found',
          error: [],
        });
      } else if (amenities.children.length === 0) {
        return res.status(404).json({
          data: null,
          message: 'Amenity has no children',
          error: [],
        });
      }
      return res.status(200).json({
        data: {
          parent: amenities.parent,
          amenities: amenities.children,
        },
        message: 'Amenity retrieved successfully',
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
 * /prop/amenity/{id}:
 *   put:
 *     summary: Cập nhật thông tin của 1 amenity theo id [ADMIN]
 *     tags: [Amenities]
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
 *               name:
 *                 type: string
 *               parentAmenityId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Amenity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     amenity:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                         parent_amentity_id:
 *                           type: integer
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 message:
 *                   type: string
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Amenity not found
 *       500:
 *         description: Internal server error
 */
router
  .route('/:id')
  .put(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, parentAmenityId, isActive } = req.body;
      const amenity = await amentityService.updateAmenity(id, {
        name,
        parentAmenityId,
        isActive,
      });
      if (!amenity) {
        return res.status(404).json({
          data: null,
          message: 'Amenity not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: { amenity: amenity },
        message: 'Amenity updated successfully',
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
