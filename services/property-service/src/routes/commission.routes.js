import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import commissionService from '../services/commission.service.js';
import propertyService from '../services/property.service.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import CommissionStatus from '../enums/commissionStatus.enum.js';

/**
 * @openapi
 * /prop/commission/confirm/{id}/property/{propertyId}:
 *   post:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Admin xác nhận giao dịch [Admin]
 *     description: Chỉ Admin có quyền xác nhận giao dịch của bài đăng.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của commission fee cần xác nhận
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài đăng bất động sản
 *     responses:
 *       200:
 *         description: Giao dịch đã được Admin xác nhận thành công
 *       401:
 *         description: Unauthorized - Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/confirm/:id/property/:propertyId')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { id, propertyId } = req.params;
    try {
      const commissionFee = await commissionService.confirmCommissionFee(id);
      const requestStatus =
        propertyService.getRequestStatusFromRequestPostStatus(
          RequestPostStatus.EXPIRED
        );
      await propertyService.completeTransaction(
        propertyId,
        RequestPostStatus.EXPIRED,
        requestStatus
      );
      return res.status(200).json({
        data: commissionFee,
        message: 'Success',
        error: null,
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: '',
        error: [err.message],
      });
    }
  });

//Admin reject transaction
/**
 * @openapi
 * /prop/commission/reject/{id}:
 *   post:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Admin từ chối giao dịch [Admin]
 *     description: Chỉ Admin có quyền từ chối giao dịch. Yêu cầu truyền lý do từ chối trong body.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của commission fee cần từ chối
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectReason:
 *                 type: string
 *                 example: "Thiếu giấy tờ hợp lệ"
 *     responses:
 *       200:
 *         description: Giao dịch đã bị từ chối thành công
 *       401:
 *         description: Unauthorized - Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/reject/:id')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { id } = req.params;
    const { rejectReason } = req.body;
    try {
      const commission = await commissionService.rejectCommissionFee(
        id,
        rejectReason
      );
      const commissionData = {
        id: commission.commission_id,
        latest_price: null,
        contract_url: null,
        status: CommissionStatus.PROCESSING,
      };
      await commissionService.updateCommission(commissionData);
      return res.status(200).json({
        data: commission,
        message: 'Success',
        error: null,
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: '',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/commission/get-all:
 *   get:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách bất động sản đã hoàn tất giao dịch và đợi admin xác nhận tính hợp lệ [Admin]
 *     description: API dành cho Admin để lấy danh sách bất động sản có `requestpost_status = published` và có commission `completed`.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [processing, confirmed, rejected]
 *         description: Trạng thái giao dịch
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên bất động sản
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách properties
 *       404:
 *         description: Không tìm thấy dữ liệu
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền
 *       500:
 *         description: Lỗi server
 */
router
  .route('/get-all')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };
      const filters = {
        search,
        status,
      };
      const { properties, total } = await commissionService.getAllCompleted(
        filters,
        pagination
      );
      if (properties.length === 0) {
        return res.status(404).json({
          data: [],
          message: 'Not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: {
          properties,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        message: 'Success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/commission/get-my:
 *   get:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách BĐS đã hoàn tất giao dịch và đang đợi xác nhận từ admin[Agent]
 *     description: API dành cho Agent, trả về danh sách BĐS có `requestpost_status = published` và agent_commission_fee của agent hiện tại.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [processing, confirmed, rejected]
 *         description: Lọc theo status trong bảng agent_commission_fee
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề BĐS (title)
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách BĐS
 *       404:
 *         description: Không tìm thấy dữ liệu
 *       401:
 *         description: Unauthorized - Agent chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/get-my')
  .get(authMiddleware, roleGuard([RoleName.Agent]), async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };

      const filters = {
        agent_id: req.user.userId,
        status,
        search,
      };
      const { properties, total } =
        await commissionService.getProcessingOfAgent(filters, pagination);
      if (properties.length === 0) {
        return res.status(404).json({
          data: [],
          message: 'Not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: {
          properties,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        message: 'Success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/commission/of-agent/{id}:
 *   get:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách BĐS đang đợi xác nhận hoàn tất giao dịch của một agent [Admin]
 *     description: API dành cho Admin, trả về danh sách BĐS có `requestpost_status = published` và agent_commission_fee của agent hiện tại.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [processing, confirmed, rejected]
 *         description: Lọc theo status trong bảng agent_commission_fee
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề BĐS (title)
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách BĐS
 *       404:
 *         description: Không tìm thấy dữ liệu
 *       401:
 *         description: Unauthorized - Agent chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/of-agent/:id')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status, search } = req.query;
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };

      const filters = {
        agent_id: Number(id),
        status,
        search,
      };
      const { properties, total } =
        await commissionService.getProcessingOfAgent(filters, pagination);
      if (properties.length === 0) {
        return res.status(404).json({
          data: [],
          message: 'Not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: {
          properties,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        message: 'Success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/commission/{id}:
 *   get:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy chi tiết một commission [Admin, Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của commission muốn xem
 *     responses:
 *       200:
 *         description: Giao dịch đã được Admin xác nhận thành công
 *       401:
 *         description: Unauthorized - Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/:id')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const { id } = req.params;
      try {
        const commission = await commissionService.getDetailCommission(id);
        return res.status(200).json({
          data: {
            commission: commission,
          },
          message: 'Success',
          error: null,
        });
      } catch (err) {
        return res.status(500).json({
          data: null,
          message: '',
          error: [err.message],
        });
      }
    }
  );

/**
 * @openapi
 * /prop/commission/of-property/{property_id}:
 *   get:
 *     tags:
 *       - Commission
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy chi tiết một commission [Admin, Agent]
 *     parameters:
 *       - in: path
 *         name: property_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của property muốn xem
 *     responses:
 *       200:
 *         description: Giao dịch đã được Admin xác nhận thành công
 *       401:
 *         description: Unauthorized - Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router
  .route('/of-property/:property_id')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      try {
        const { property_id } = req.params;

        // Validate property_id
        if (!property_id || isNaN(Number(property_id))) {
          return res.status(400).json({
            data: null,
            message: 'Invalid property ID',
            error: ['Property ID must be a valid number'],
          });
        }

        const propertyId = Number(property_id);
        const token = req.token;

        // Get property data
        const property = await commissionService.getByPropertyId(propertyId);
        if (!property) {
          return res.status(404).json({
            data: null,
            message: 'Property not found',
            error: [],
          });
        }

        // Initialize default response data
        const responseData = {
          property,
          transaction: {
            transactionFee: null,
            agent: null,
          },
        };

        // Check if commissions exist
        if (!property?.commissions?.length) {
          return res.status(200).json({
            data: responseData,
            message: 'No transactions found for this property',
            error: [],
          });
        }

        // Get commission fee and agent info
        const commissionId = property.commissions[0].id;
        const { commissionFee, agent } =
          await commissionService.getCommissionFeeByCommission(
            commissionId,
            token
          );

        // Update response data with transaction info
        responseData.transaction = {
          transactionFee: commissionFee || null,
          agent: agent || null,
        };

        return res.status(200).json({
          data: responseData,
          message: 'Success',
          error: [],
        });
      } catch (error) {
        return res.status(500).json({
          data: null,
          message: 'Server error',
          error: [error.message || 'An unexpected error occurred'],
        });
      }
    }
  );

export default router;
