import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import CommissionType from '../enums/commissionType.enum.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';
import CommissionStatus from '../enums/commissionStatus.enum.js';

import propertyService from '../services/property.service.js';
import locationService from '../services/location.service.js';
import mediaService from '../services/media.service.js';
import detailPropertyService from '../services/category.detail.service.js';
import amenityService from '../services/amentity.service.js';
import agentHistoryService from '../services/propertyAgentHistory.service.js';
import commissionService from '../services/commission.service.js';
import { getPublicAgentInfor } from '../helpers/authClient.js';
import CustomerRequestType from '../enums/CustomerRequestType.enum.js';
import CustomerRequestStatus from '../enums/CustomerRequestStatus.enum.js';

import { getProfile, getCustomerProfile } from '../helpers/authClient.js';

// Lấy danh sách propertyIds từ agentId
// hint: sử dụng getHistoryByAgentId
router
  .route('/post/assigned-of-agent/:agentId')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const { agentId } = req.params;
        const propertyIds =
          await agentHistoryService.getHistoryByAgentId(agentId);
        return res.status(200).json({
          data: propertyIds,
          message: 'Property ids retrieved',
          error: [],
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
 * /prop/{id}/relate:
 *   get:
 *     tags:
 *       - Property
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID của bất động sản
 *     summary: Lấy 2 bất động sản liên quan cùng danh mục [ALL ROLE]
 *     description: Chỉ customer mới có quyền lấy 2 bất động sản liên quan cùng danh mục
 *     responses:
 *       200:
 *         description: Danh sách 2 bất động sản liên quan cùng danh mục
 */
router.get('/:id/relate', async (req, res) => {
  try {
    const { id } = req.params;
    const property = await propertyService.getBasicInfoById(id);
    const count = 2;
    if (!property) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Property not found'],
      });
    }
    const relateProperties = await propertyService.getRelateProperties(
      id,
      property.category_id,
      count
    );
    return res.status(200).json({
      data: {
        relateProperties,
      },
      message: 'Relate properties found',
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

// customer lấy danh sách yêu cầu ký gửi
/**
 * @openapi
 * /prop/request/get-all:
 *   get:
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số phần tử mỗi trang (mặc định 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: requestStatus
 *         schema:
 *           type: enum
 *           enum: [pending, published, rejected, completed]
 *         description: Trạng thái yêu cầu
 *       - in: query
 *         name: myAssigned
 *         schema:
 *           type: boolean
 *     summary: Lấy danh sách yêu cầu ký gửi [CUSTOMER, ADMIN, AGENT]
 *     description: Chỉ customer mới có quyền lấy danh sách yêu cầu ký gửi
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu ký gửi
 */

//xử lý phân trang
router.get(
  '/request/get-all',
  authMiddleware,
  roleGuard([RoleName.Customer, RoleName.Agent, RoleName.Admin]),
  async (req, res) => {
    try {
      const userData = req.user;
      const {
        page = 1,
        limit = 10,
        search,
        requestStatus,
        myAssigned,
      } = req.query;

      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };
      const filters = {
        search,
        requestStatus,
      };
      const filterForAgent = {
        ...filters,
        myAssigned: myAssigned === 'true',
      };

      let requests = [];
      let total = 0;
      switch (userData.userRole) {
        case RoleName.Customer:
          ({ requests, total } =
            await propertyService.getRequestPostByCustomerId(
              userData.userId,
              pagination,
              filters
            ));
          break;

        case RoleName.Agent:
          ({ requests, total } = await propertyService.getRequestPostByAgentId(
            userData.userId,
            pagination,
            filterForAgent
          ));
          break;
        case RoleName.Admin:
          ({ requests, total } = await propertyService.getAllRequestPost(
            pagination,
            filters
          ));
          break;

        default:
          return res.status(403).json({
            data: null,
            message: 'Forbidden - Role not allowed',
            error: [],
          });
      }

      return res.status(200).json({
        data: {
          requests,
          pagination: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
          },
        },
        message: 'Request post found',
        error: [],
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
 * @swagger
 * /prop/assign-agent:
 *   post:
 *     summary: Gán bất động sản cho các agent [CUSTOMER, ADMIN]
 *     description: API cho phép khách hàng hoặc admin gán một bất động sản cụ thể cho các agent
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - agents
 *             properties:
 *               propertyId:
 *                 type: integer
 *                 example: 14
 *               agents:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Gán agent thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                   example: Property assigned
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       404:
 *         description: Bất động sản không tồn tại
 *       500:
 *         description: Lỗi server
 */
router
  .route('/assign-agent')
  .post(
    authMiddleware,
    roleGuard([RoleName.Customer, RoleName.Admin]),
    async (req, res) => {
      try {
        const { propertyId, agents } = req.body;
        const userRole = req.user.userRole;
        const token = req.token;
        const basicPropertyInfo =
          await propertyService.getBasicProperty(propertyId);
        if (!basicPropertyInfo) {
          return res.status(404).json({
            data: null,
            message: '',
            error: ['Property not found'],
          });
        }
        let customerProfile = null;
        if (userRole === RoleName.Admin && basicPropertyInfo.sender_id) {
          customerProfile = await getCustomerProfile(
            basicPropertyInfo.sender_id,
            token
          );
        } else {
          customerProfile = await getProfile(token);
        }
        const agentsData = await Promise.all(
          agents.map(async (agentId) => {
            const agent = await getCustomerProfile(agentId, token);
            return agent.data.user;
          })
        );

        const propertyAgentHistories =
          await propertyService.assignAgentToRequest(
            basicPropertyInfo,
            agentsData,
            customerProfile
          );

        return res.status(200).json({
          data: { history: propertyAgentHistories },
          message: 'Property assigned',
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
 * /prop/list-post:
 *   get:
 *     summary: Lấy danh sách bất động sản ở màn hình quản lý [ADMIN, AGENT]
 *     description: Lọc theo trạng thái, phân trang, tìm kiếm...
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số phần tử mỗi trang (mặc định 10)
 *       - in: query
 *         name: requestPostStatus
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, published, rejected, sold, hidden]
 *         description: Trạng thái bài viết cần lọc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tiêu đề hoặc mô tả
 *       - in: query
 *         name: needsType
 *         schema:
 *           type: string
 *         description: Lọc theo loại nhu cầu
 *     responses:
 *       200:
 *         description: Thành công
 */
router
  .route('/list-post')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const user = req.user;

        const {
          page = 1,
          limit = 10,
          requestPostStatus,
          search,
          needsType,
        } = req.query;

        const pagination = {
          page: Number(page),
          limit: Number(limit),
        };

        const filters = {
          userId: user.userId,
          userRole: user.userRole,
          requestPostStatus,
          search,
          needsType,
        };

        const { properties, total } =
          await propertyService.getFilteredProperties(filters, pagination);

        return res.status(200).json({
          data: {
            properties,
            pagination: {
              total,
              page: pagination.page,
              limit: pagination.limit,
              totalPages: Math.ceil(total / pagination.limit),
            },
          },
          message: 'Properties found',
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
 * /prop/public-list:
 *   get:
 *     summary: Lấy danh sách bất động sản công khai [GUEST]
 *     description: Truy vấn bất động sản theo vị trí, loại, nhu cầu, tìm kiếm và phân trang.
 *     tags:
 *       - Property
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số phần tử mỗi trang (mặc định 10)
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Vĩ độ trung tâm để tìm trong bán kính
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Kinh độ trung tâm để tìm trong bán kính
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Bán kính (km) để lọc theo vị trí (mặc định 5km)
 *       - in: query
 *         name: assetsId
 *         schema:
 *           type: integer
 *         description: Lọc theo loại tài sản
 *       - in: query
 *         name: needsId
 *         schema:
 *           type: integer
 *         description: Lọc theo nhu cầu
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề hoặc mô tả
 *       - in: query
 *         name: needsType
 *         schema:
 *           type: string
 *         description: Lọc theo loại nhu cầu
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/public-list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius = 5,
      assetsId,
      needsId,
      search,
      needsType,
    } = req.query;

    const pagination = {
      page: Number(page),
      limit: Number(limit),
    };

    const filters = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius),
      assetsId: Number(assetsId),
      needsId: Number(needsId),
      search,
      needsType,
    };

    const { properties, total } =
      await propertyService.getPublicFilteredProperties(filters, pagination);

    return res.status(200).json({
      data: {
        properties,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
      message: 'Public properties found',
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

router.get('/filter-prop', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius = 5,
      assetsId,
      needsId,
      search,
    } = req.query;

    const pagination = {
      page: Number(page),
      limit: Number(limit),
    };

    const filters = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius),
      assetsId: Number(assetsId),
      needsId: Number(needsId),
      search,
    };

    const { properties, total } =
      await propertyService.getFilteredPropertiesForPrivate(
        filters,
        pagination
      );

    return res.status(200).json({
      data: {
        properties,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
      message: 'Public properties found',
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
 * /prop/request:
 *   post:
 *     summary: Tạo mới một yêu cầu bất động sản [CUSTOMER]
 *     description: API cho phép khách hàng tạo mới một yêu cầu bất động sản tai màn hình thêm mới. Customer bâm nút Gửi
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - beforePriceTag
 *               - price
 *               - afterPriceTag
 *               - assetsId
 *               - needsId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Bán nhà phố trung tâm Quận 1
 *               description:
 *                 type: string
 *                 example: Nhà phố sang trọng, tiện nghi đầy đủ, gần trung tâm thương mại.
 *               beforePriceTag:
 *                 type: string
 *                 example: Giá chỉ từ
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 50000000000.99
 *               afterPriceTag:
 *                 type: string
 *                 example: VNĐ
 *               assetsId:
 *                 type: integer
 *                 example: 2
 *               needsId:
 *                 type: integer
 *                 example: 4
 *               location:
 *                 type: object
 *                 properties:
 *                   addrCity:
 *                     type: string
 *                     example: Hồ Chí Minh
 *                   addrDistrict:
 *                     type: string
 *                     example: Quận 1
 *                   addrStreet:
 *                     type: string
 *                     example: Nguyễn Huệ
 *                   addrDetails:
 *                     type: string
 *                     example: Sát phố đi bộ
 *                   latitude:
 *                     type: number
 *                     format: float
 *                     example: 10.7769
 *                   longitude:
 *                     type: number
 *                     format: float
 *                     example: 106.7009
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: image
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: image
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     categoryDetailId:
 *                       type: integer
 *                       example: 1
 *                     value:
 *                       type: string
 *                       example: "3"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               commissionType:
 *                 type: string
 *                 example: "buying"
 *     responses:
 *       201:
 *         description: Tạo mới yêu cầu bất động sản thành công
 *       400:
 *         description: Tạo mới yêu cầu bất động sản không thành công
 *       500:
 *         description: Lỗi server
 */
router
  .route('/request')
  .post(authMiddleware, roleGuard([RoleName.Customer]), async (req, res) => {
    try {
      const {
        title,
        description,
        beforePriceTag,
        price,
        afterPriceTag,
        assetsId,
        needsId,
        location,
        media,
        details,
        amenities,
        commissionType,
      } = req.body;
      const user = req.user;
      const senderId = user.userId;
      const property = await propertyService.createRequestProperty({
        senderId,
        title,
        description,
        beforePriceTag,
        price,
        afterPriceTag,
        assetsId,
        needsId,
        stage: 'request',
      });

      if (!property) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Property not created'],
        });
      }

      const propertyId = property.id;
      if (commissionType) {
        await commissionService.initCommission({
          property_id: propertyId,
          type: commissionType,
          commission: 0,
        });
      }
      if (location) {
        await locationService.updateOrCreateLocation({
          propertyId: propertyId,
          ...location,
        });
      }
      if (Array.isArray(media) && media.length > 0) {
        await mediaService.createMedia(
          media.map((item, index) => ({
            propertyId: propertyId,
            ...item,
            order: index + 1,
          }))
        );
      }
      if (Array.isArray(details) && details.length > 0) {
        await detailPropertyService.createProperyDetail(
          details.map((detail) => ({
            ...detail,
            propertyId: propertyId,
          }))
        );
      }
      if (Array.isArray(amenities) && amenities.length > 0) {
        await amenityService.createAmenityProperty(
          amenities.map((amenityId) => ({
            amenity_id: amenityId,
            propertyId: propertyId,
          }))
        );
      }
      // await propertyService.notifyNewPropertySubmission(
      //   property,
      //   location,
      //   user
      // );
      return res.status(201).json({
        data: {
          property: property,
          location: location,
          media: media,
          amenities: amenities,
          details: details,
          commissionType: commissionType,
        },
        message: 'Property created',
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
 * /prop/post:
 *   post:
 *     summary: Tạo mới  bất động sản [ADMIN, AGENT]
 *     description: API cho phép agent/admin tạo mới hoặc cập nhật bất động sản. [Màn hình thêm mới] gồm các nút Lưu nháp (Agent/Admin) requestPostStatus = draft, nút Xuất bản (Admin) requestPostStatus = published, nút Gửi duyệt (Agent) requestPostStatus = pending_approval. [Màn hình cập nhật] gồm các nút Lưu (Agent/Admin) giữ nguyên trạng thái của requestPostStatus, nút Gửi duyệt (Agent) requestPostStatus = pending_approval, nút Xuất bản (Admin) requestPostStatus = published.
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - beforePriceTag
 *               - price
 *               - afterPriceTag
 *               - commissionType
 *               - assetsId
 *               - needsId
 *               - requestPostStatus
 *             properties:
 *               title:
 *                 type: string
 *                 example: Bán nhà phố trung tâm Quận 1
 *               description:
 *                 type: string
 *                 example: Nhà phố sang trọng, tiện nghi đầy đủ, gần trung tâm thương mại.
 *               beforePriceTag:
 *                 type: string
 *                 example: Giá chỉ từ
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 50000000000.99
 *               afterPriceTag:
 *                 type: string
 *                 example: VNĐ
 *               assetsId:
 *                 type: integer
 *                 example: 2
 *               needsId:
 *                 type: integer
 *                 example: 4
 *               requestPostStatus:
 *                 type: string
 *                 example: pending_approval
 *               location:
 *                 type: object
 *                 properties:
 *                   addrCity:
 *                     type: string
 *                     example: Hồ Chí Minh
 *                   addrDistrict:
 *                     type: string
 *                     example: Quận 1
 *                   addrStreet:
 *                     type: string
 *                     example: Nguyễn Huệ
 *                   addrDetails:
 *                     type: string
 *                     example: Sát phố đi bộ
 *                   latitude:
 *                     type: number
 *                     format: float
 *                     example: 10.7769
 *                   longitude:
 *                     type: number
 *                     format: float
 *                     example: 106.7009
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: image
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: image
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     categoryDetailId:
 *                       type: integer
 *                       example: 1
 *                     value:
 *                       type: string
 *                       example: "3"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               commissionType:
 *                 type: string
 *                 example: buying
 *               commission:
 *                 type: number
 *                 format: double
 *                 example: 2
 *     responses:
 *       200:
 *         description: Tạo mới hoặc cập nhật bất động sản thành công
 *       400:
 *         description: Tạo mới hoặc cập nhật bất động sản không thành công
 *       500:
 *         description: Lỗi server
 */
router
  .route('/post')
  .post(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const {
          title,
          description,
          beforePriceTag,
          price,
          afterPriceTag,
          assetsId,
          needsId,
          requestPostStatus,
          location,
          media,
          details,
          amenities,
          commissionType,
          commission,
        } = req.body;

        const user = req.user;
        const senderId = user.userId;

        let property = null;
        let locationSaved = null;
        let mediaSaved = null;
        let detailsSaved = null;
        let amenitiesSaved = null;
        const maxCommissionForSelling = 10;

        const errors = [];

        // Phân quyền trạng thái theo role
        if (user.userRole === RoleName.Agent) {
          if (
            requestPostStatus !== RequestPostStatus.PENDING_APPROVAL &&
            requestPostStatus !== RequestPostStatus.DRAFT
          ) {
            return res.status(400).json({
              data: null,
              message: '',
              error: ['You do not have permission to set this status.'],
            });
          }
        }
        if (commissionType == CommissionType.BUYING && !commission) {
          return res.status(400).json({
            data: null,
            message: '',
            error: ['You must set commission for buying property.'],
          });
        }
        if (
          commissionType == CommissionType.BUYING &&
          commission > maxCommissionForSelling
        ) {
          return res.status(400).json({
            data: null,
            message: '',
            error: [
              `Commission must be less than or equal to ${maxCommissionForSelling} for buying property.`,
            ],
          });
        }

        // Tạo property
        property = await propertyService.createPostProperty({
          senderId,
          title,
          description,
          beforePriceTag,
          price,
          afterPriceTag,
          assetsId,
          needsId,
          requestPostStatus,
        });

        if (!property) {
          return res.status(400).json({
            data: null,
            message: '',
            error: ['Property not created'],
          });
        }

        const propertyId = property.id;

        // Tạo location
        if (location) {
          try {
            locationSaved = await locationService.updateOrCreateLocation({
              propertyId,
              ...location,
            });
          } catch (err) {
            errors.push('Failed to create location: ' + err.message);
          }
        }

        // Tạo media
        if (Array.isArray(media) && media.length > 0) {
          try {
            mediaSaved = await mediaService.createMedia(
              media.map((item, index) => ({
                propertyId,
                ...item,
                order: index + 1,
              }))
            );
          } catch (err) {
            errors.push('Failed to create media: ' + err.message);
          }
        }

        // Tạo details
        if (Array.isArray(details) && details.length > 0) {
          try {
            detailsSaved = await detailPropertyService.createProperyDetail(
              details.map((detail) => ({
                ...detail,
                propertyId,
              }))
            );
          } catch (err) {
            errors.push('Failed to create property details: ' + err.message);
          }
        }

        // Tạo amenities
        if (Array.isArray(amenities) && amenities.length > 0) {
          try {
            amenitiesSaved = await amenityService.createAmenityProperty(
              amenities.map((amenityId) => ({
                amenity_id: amenityId,
                propertyId,
              }))
            );
          } catch (err) {
            errors.push('Failed to attach amenities: ' + err.message);
          }
        }
        // tạo mới history cho agent/admin.
        try {
          await agentHistoryService.createHistory({
            propertyId,
            agentId: user.userId,
            userRole: user.userRole,
          });
        } catch (err) {
          errors.push('Failed to create history:' + err.message);
        }

        // Gửi noti đến admin nếu agent là người tạo
        // if(user.userRole === RoleName.Agent) {
        //   try {
        //     await propertyService.notifyNewPropertySubmission(property, location, user);
        //   } catch (err) {
        //     errors.push('Failed to send notification: ' + err.message);
        //   }
        // }

        // Tạo commission
        if (commissionType) {
          try {
            await commissionService.initCommission({
              property_id: propertyId,
              type: commissionType,
              commission,
            });
          } catch (err) {
            errors.push('Failed to create commission: ' + err.message);
          }
        }

        return res.status(201).json({
          data: {
            property: property,
            location: locationSaved,
            media: mediaSaved ?? null,
            amenities: amenitiesSaved ?? [],
            details: detailsSaved ?? [],
          },
          message: 'Property created',
          error: errors,
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
 * /prop/post/{id}:
 *   put:
 *     summary: Cập nhật bất động sản với stage là post và RequestPostStatus là pending_approval [ADMIN, AGENT]
 *     description: API cho phép agent/admin cập nhật bất động sản với stage là post và RequestPostStatus là pending_approval
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Bán nhà phố trung tâm Quận 1
 *               description:
 *                 type: string
 *                 example: Nhà phố sang trọng, tiện nghi đầy đủ, gần trung tâm thương mại.
 *               beforePriceTag:
 *                 type: string
 *                 example: Giá chỉ từ
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 50000000000.99
 *               afterPriceTag:
 *                 type: string
 *                 example: VNĐ
 *               assetsId:
 *                 type: integer
 *                 example: 2
 *               needsId:
 *                 type: integer
 *                 example: 4
 *               requestPostStatus:
 *                 type: string
 *                 example: pending_approval
 *               location:
 *                 type: object
 *                 properties:
 *                   addrCity:
 *                     type: string
 *                     example: Hồ Chí Minh
 *                   addrDistrict:
 *                     type: string
 *                     example: Quận 1
 *                   addrStreet:
 *                     type: string
 *                     example: Nguyễn Huệ
 *                   addrDetails:
 *                     type: string
 *                     example: Sát phố đi bộ
 *                   latitude:
 *                     type: number
 *                     format: float
 *                     example: 10.7769
 *                   longitude:
 *                     type: number
 *                     format: float
 *                     example: 106.7009
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                        type: string
 *                        example: image
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: image
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     categoryDetailId:
 *                       type: integer
 *                       example: 1
 *                     value:
 *                       type: string
 *                       example: "3"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               commission:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *                   commission:
 *                     type: number
 *                     format: double
 *                     example: 1.5
 *     responses:
 *       200:
 *         description: Cập nhật bất động sản thành công
 *       400:
 *         description: Cập nhật bất động sản không thành công
 *       500:
 *         description: Lỗi server
 */
router
  .route('/post/:id')
  .put(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const {
          title,
          description,
          beforePriceTag,
          price,
          afterPriceTag,
          assetsId,
          needsId,
          requestPostStatus,
          location,
          media,
          details,
          amenities,
          commission,
        } = req.body;

        const { id } = req.params;
        const user = req.user;

        let property = await propertyService.getById(id);
        if (!property) {
          return res.status(404).json({
            data: null,
            message: '',
            error: ['Property not found'],
          });
        }
        const errors = [];
        if (commission && !commission.commission) {
          return res.status(400).json({
            data: null,
            message: '',
            error: ['Commission value is required with buying type'],
          });
        }

        // AGENT: chỉ được sửa bài của mình
        if (user.userRole === RoleName.Agent) {
          const isAgentOwner = await agentHistoryService.verifyOwnerPost(
            user.userId,
            id
          );
          if (!isAgentOwner) {
            return res.status(403).json({
              data: null,
              message: '',
              error: ['You are not allowed to update this property'],
            });
          }

          // if (property.requestpost_status === RequestPostStatus.PUBLISHED) {
          //   return res.status(400).json({
          //     data: null,
          //     message: '',
          //     error: [
          //       'Cannot update published posts, must have admin approval',
          //     ],
          //   });
          // }

          if (
            requestPostStatus !== RequestPostStatus.DRAFT &&
            requestPostStatus !== RequestPostStatus.PENDING_APPROVAL
          ) {
            return res.status(400).json({
              data: null,
              message: '',
              error: ['Invalid status transition'],
            });
          }
        }

        // Cập nhật property
        let requestStatus = property.request_status;
        if (requestPostStatus) {
          requestStatus =
            propertyService.getRequestStatusFromRequestPostStatus(
              requestPostStatus
            );
        }
        property = await propertyService.updatePostProperty(id, {
          title,
          description,
          beforePriceTag,
          price,
          afterPriceTag,
          assetsId,
          needsId,
          requestPostStatus,
          requestStatus,
        });
        if (!property) {
          return res.status(400).json({
            data: null,
            message: '',
            error: ['Failed to update property'],
          });
        }

        const propertyId = property.id;
        let locationSaved = null;
        let mediaSaved = null;
        let detailsSaved = null;
        let amenitiesSaved = null;

        // Update location
        if (location) {
          try {
            locationSaved = await locationService.updateOrCreateLocation({
              propertyId,
              ...location,
            });
          } catch (err) {
            errors.push('Failed to update location: ' + err.message);
          }
        }

        // Update media
        if (Array.isArray(media)) {
          try {
            await mediaService.deleteByPropertyId(propertyId); // xóa cũ
            mediaSaved = await mediaService.createMedia(
              media.map((item, index) => ({
                propertyId,
                ...item,
                order: index + 1,
              }))
            );
          } catch (err) {
            errors.push('Failed to update media: ' + err.message);
          }
        }

        // Update details
        if (Array.isArray(details)) {
          try {
            await detailPropertyService.deleteByPropertyId(propertyId); // xóa cũ
            detailsSaved = await detailPropertyService.createProperyDetail(
              details.map((detail) => ({
                ...detail,
                propertyId,
              }))
            );
          } catch (err) {
            errors.push('Failed to update property details: ' + err.message);
          }
        }

        // Update amenities
        if (Array.isArray(amenities)) {
          try {
            await amenityService.deleteByPropertyId(propertyId); // xóa cũ
            amenitiesSaved = await amenityService.createAmenityProperty(
              amenities.map((amenityId) => ({
                amenity_id: amenityId,
                propertyId,
              }))
            );
          } catch (err) {
            errors.push('Failed to update amenities: ' + err.message);
          }
        }

        // Update or create commission
        if (commission) {
          try {
            if (commission.id) {
              await commissionService.updateCommission(commission);
            } else {
              await commissionService.initCommission({
                property_id: propertyId,
                type: commission.type,
                commission: commission.commission,
              });
            }
          } catch (err) {
            errors.push('Failed to update commission: ' + err.message);
          }
        }

        return res.status(200).json({
          data: {
            property: property,
            location: locationSaved,
            media: mediaSaved ?? null,
            details: detailsSaved ?? [],
            amenities: amenitiesSaved ?? [],
          },
          message: 'Property updated',
          error: errors,
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

// admin/agent lấy danh sách các property đang nháp
/**
 * @swagger
 * /prop/post/draft:
 *   get:
 *     summary: Lấy danh sách bất động sản ở trạng thái draft [ADMIN, AGENT]
 *     description: API cho phép agent hoặc admin lấy danh sách các bất động sản có requestPostStatus là draft. Yêu cầu xác thực và vai trò phù hợp.
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: Số lượng kết quả trên một trang
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách bất động sản được lấy ra thành công
 *       404:
 *         description: Không tìm thấy bất động sản
 *       500:
 *         description: Lỗi server

 */
router
  .route('/post/draft')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      const { page = 1, limit = 10, search } = req.query;
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };
      const filters = {
        search,
      };
      try {
        const user = req.user;
        const { properties, total } = await propertyService.getDraftProperties(
          user.userId,
          pagination,
          filters
        );
        if (!properties) {
          return res.status(404).json({
            data: null,
            message: '',
            error: ['Properties not found'],
          });
        }
        return res.status(200).json({
          data: {
            properties: properties,
            pagination: {
              total,
              page: pagination.page,
              limit: pagination.limit,
              totalPages: Math.ceil(total / pagination.limit),
            },
          },
          message: 'Properties found',
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
 * /prop/post/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết bài đăng bất động sản [ADMIN, AGENT]
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bất động sản
 *     responses:
 *       200:
 *         description: Thông tin bất động sản được tìm thấy
 */

router
  .route('/post/:id')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const user = req.user;
        let agent = null;
        // AGENT: chỉ được xem bài của mình
        if (user.userRole === RoleName.Agent) {
          const isAgentOwner = agentHistoryService.verifyOwnerPost(
            user.userId,
            id
          );
          if (!isAgentOwner) {
            return res.status(403).json({
              data: null,
              message: '',
              error: ['You are not allowed to view this property'],
            });
          }
        }

        const { responseProperty, agent_id } =
          await propertyService.getById(id);
        if (!responseProperty) {
          return res.status(404).json({
            data: null,
            message: '',
            error: ['Property not found'],
          });
        }
        console.log('agent', agent_id);
        if (agent_id) {
          agent = await getPublicAgentInfor(agent_id);
        }
        return res.status(200).json({
          data: {
            property: responseProperty,
            agent: agent,
          },
          message: 'Property found',
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
 * /prop/{slug}:
 *   get:
 *     summary: Lấy thông tin chi tiết bài đăng bất động sản [ALL ROLE]
 *     tags:
 *       - Property
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: slug của bài đăng
 *     responses:
 *       200:
 *         description: Thông tin bất động sản được tìm thấy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Property found
 *                 error:
 *                   type: array
 *                   items: {}
 *                   example: []
 *                 data:
 *                   type: object
 *                   properties:
 *                     property:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 17
 *                         sender_id:
 *                           type: integer
 *                           nullable: true
 *                         title:
 *                           type: string
 *                           example: Bán nhà phố trung tâm Quận 1 upate
 *                         description:
 *                           type: string
 *                           example: Nhà phố sang trọng, tiện nghi đầy đủ, gần trung tâm thương mại.
 *                         before_price_tag:
 *                           type: string
 *                           example: Giá chỉ từ
 *                         price:
 *                           type: string
 *                           example: "50000000000.99"
 *                         after_price_tag:
 *                           type: string
 *                           example: VNĐ
 *                         stage:
 *                           type: string
 *                           example: post
 *                         request_status:
 *                           type: string
 *                           nullable: true
 *                         requestpost_status:
 *                           type: string
 *                           example: published
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-06-21T07:43:46.769Z
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-06-21T08:20:58.307Z
 *                         locations:
 *                           type: object
 *                           properties:
 *                             addr_city:
 *                               type: string
 *                               example: Hồ Chí Minh
 *                             addr_district:
 *                               type: string
 *                               example: Quận 1
 *                             addr_street:
 *                               type: string
 *                               example: Nguyễn Huệ
 *                             addr_details:
 *                               type: string
 *                               example: Sát phố đi bộ
 *                             latitude:
 *                               type: number
 *                               format: float
 *                               example: 10.7769
 *                             longitude:
 *                               type: number
 *                               format: float
 *                               example: 106.7009
 *                         media:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: image
 *                               url:
 *                                 type: string
 *                                 example: https://example.com/image1.jpg
 *                               order:
 *                                 type: integer
 *                                 example: 1
 *                         details:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "3"
 *                               category_detail:
 *                                 type: object
 *                                 properties:
 *                                   field_name:
 *                                     type: string
 *                                     example: string
 *                                   field_type:
 *                                     type: string
 *                                     example: number
 *                         amenities:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               amenity:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     example: Thử nghiệm
 *                         assets:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: nhà phố hồ tây
 *                             type:
 *                               type: string
 *                               example: assets
 *                         needs:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Đất nền
 *                             type:
 *                               type: string
 *                               example: assets
 */
router.route('/:slug').get(async (req, res) => {
  try {
    const { slug } = req.params;
    const property = await propertyService.getBySlug(slug);
    if (!property) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Property not found'],
      });
    }
    if (
      property.requestpost_status !== RequestPostStatus.PUBLISHED &&
      property.requestpost_status !== RequestPostStatus.SOLD &&
      property.requestpost_status !== RequestPostStatus.EXPIRED
    ) {
      return res.status(404).json({
        data: null,
        message: '',
        error: ['Property not found'],
      });
    }

    return res.status(200).json({
      data: {
        property: property,
      },
      message: 'Property found',
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

// Cập nhật trạng thái của bài đăng
/**
 * @openapi
 * /prop/post/{id}/status:
 *   put:
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     summary: Cập nhật trạng thái của bài đăng tại màn hình danh sách[Admin, Agent]
 *     description: Chỉ Admin và Agent mới có quyền cập nhật trạng thái của bài đăng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài đăng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestPostStatus:
 *                 type: string
 *                 example: published
 *     responses:
 *       200:
 *         description: Trạng thái của bài đăng đã được cập nhật
 */
router.put(
  '/post/:id/status',
  authMiddleware,
  roleGuard([RoleName.Admin, RoleName.Agent]),
  async (req, res) => {
    try {
      const { requestPostStatus } = req.body;
      const { id } = req.params;
      const user = req.user;

      if (!requestPostStatus) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Missing requestPostStatus'],
        });
      }

      const property = await propertyService.getBasicInfoById(id);
      if (!property) {
        return res.status(404).json({
          data: null,
          message: '',
          error: ['Property not founddd'],
        });
      }

      // Nếu là Agent, kiểm tra quyền sở hữu và trạng thái hợp lệ
      if (user.userRole === RoleName.Agent) {
        const isOwner = await agentHistoryService.verifyOwnerPost(
          user.userId,
          id
        );
        if (!isOwner) {
          return res.status(403).json({
            data: null,
            message: '',
            error: ['You are not allowed to update this property'],
          });
        }
        if (requestPostStatus === RequestPostStatus.PUBLISHED) {
          return res.status(403).json({
            data: null,
            message: '',
            error: ['Agents cannot publish posts directly'],
          });
        }
      }

      // Cập nhật trạng thái
      let requestStatus = property.request_status;
      if (requestPostStatus) {
        requestStatus =
          propertyService.getRequestStatusFromRequestPostStatus(
            requestPostStatus
          );
      }
      const updatedProperty = await propertyService.updateStatusOfPostProperty(
        property.id,
        requestPostStatus,
        requestStatus
      );

      return res.status(200).json({
        data: updatedProperty,
        message: 'Post status updated',
        error: [],
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

//api xác thực agent có phải là ngừoi đảm nhiệm bất động sản không
router
  .route('/post/verify-agent/:id')
  .get(authMiddleware, roleGuard([RoleName.Agent]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const isOwner = await agentHistoryService.verifyOwnerPost(
        user.userId,
        id
      );
      if (!isOwner) {
        return res.status(403).json({
          data: null,
          message: '',
          error: ['You are not allowed to update this property'],
        });
      }

      return res.status(200).json({
        data: null,
        message: 'Agent is verified as owner of the post',
        error: [],
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
 * /prop/post/complete-transaction/{id}:
 *   post:
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     summary: Hoàn thành giao dịch của bài đăng[Admin, Agent]
 *     description: Chỉ Admin và Agent mới có quyền hoàn bấm nút hoàn thành.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài đăng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: integer
 *               commission_id:
 *                 type: integer
 *                 example: 1
 *               last_price:
 *                 type: number
 *                 example: 1000000
 *               commission:
 *                 type: number
 *                 format: double
 *                 example: 10
 *               contract_url:
 *                 type: string
 *                 example: 'http://example.com/contract.pdf'
 *     responses:
 *       200:
 *         description: Giao dịch của bài đăng đã được hoàn thành
 */
router
  .route('/post/complete-transaction/:id')
  .post(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      const { agent_id, commission_id, last_price, commission, contract_url } =
        req.body;
      const user = req.user;
      const { id } = req.params;
      if (contract_url === null) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Missing contract_url'],
        });
      }
      const commissionData = {
        id: commission_id,
        commission: commission,
        latest_price: last_price,
        contract_url: contract_url,
        status: CommissionStatus.COMPLETED,
      };
      let agentCommissionFeeStatus = AgentCommissionFeeStatus.PROCESSING;
      if (user.userRole === RoleName.Admin) {
        agentCommissionFeeStatus = AgentCommissionFeeStatus.CONFIRMED;
        const requestStatus =
          propertyService.getRequestStatusFromRequestPostStatus(
            RequestPostStatus.EXPIRED
          );
        await propertyService.completeTransaction(
          id,
          RequestPostStatus.EXPIRED,
          requestStatus
        );
        await commissionService.updateCommission(commissionData);
        let agentId = user.userId;
        if (agent_id != null) {
          agentId = agent_id;
        }
        await commissionService.createAgentCommissionFee({
          commission_id: commission_id,
          agent_id: agentId,
          commission_value: (last_price * commission) / 100,
          status: agentCommissionFeeStatus,
        });

        return res.status(200).json({
          data: null,
          message: 'Transaction completed',
          error: null,
        });
      }

      if (user.userRole === RoleName.Agent) {
        const isOwner = await agentHistoryService.verifyOwnerPost(
          user.userId,
          id
        );
        if (!isOwner) {
          return res.status(403).json({
            data: null,
            message: '',
            error: ['You are not allowed to update this property'],
          });
        }
        await commissionService.createAgentCommissionFee({
          commission_id: commission_id,
          agent_id: user.userId,
          commission_value: (last_price * commission) / 100,
          status: AgentCommissionFeeStatus.PROCESSING,
        });
        await commissionService.updateCommission(commissionData);
        return res.status(200).json({
          data: null,
          message: 'Success, Wait admin confirm',
          error: null,
        });
      }
    }
  );

/**
 * @openapi
 * /prop/request-delete:
 *   post:
 *     tags:
 *       - Customer request
 *     security:
 *       - bearerAuth: []
 *     summary: Gửi yêu cầu xóa BĐS [Customer]
 *     description: API cho **Customer** gửi yêu cầu xóa một BĐS mà họ đã đăng.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               property_id:
 *                 type: integer
 *                 example: 123
 *               reason:
 *                 type: string
 *                 example: "Không còn muốn bán nữa"
 *     responses:
 *       200:
 *         description: Gửi yêu cầu xóa thành công.
 *       401:
 *         description: Unauthorized - Khách hàng chưa đăng nhập hoặc token không hợp lệ.
 *       403:
 *         description: Forbidden - Không có quyền Customer.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/request-delete')
  .post(authMiddleware, roleGuard([RoleName.Customer]), async (req, res) => {
    const { property_id, reason } = req.body;
    const user = req.user;
    await propertyService.initCustomerRequest({
      customer_id: user.userId,
      property_id: Number(property_id),
      type: CustomerRequestType.DELETE,
      status: CustomerRequestStatus.PENDING,
      reason: reason || '',
    });
    return res.status(200).json({
      data: null,
      message: 'Property deleted',
      error: null,
    });
  });

/**
 * @openapi
 * /prop/customer-request/get-customer-request:
 *   get:
 *     tags:
 *       - Customer request
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách yêu cầu của khách hàng [Agent, Admin]
 *     description: API cho phép **Agent** hoặc **Admin** lấy danh sách các yêu cầu của khách hàng (xóa, chỉnh sửa,...).
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang.
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: enum
 *           enum: [delete, update]
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: enum
 *           enum: [pending, completed]
 *     responses:
 *       200:
 *         description: Thành công - trả về danh sách yêu cầu.
 *       401:
 *         description: Unauthorized - Người dùng chưa đăng nhập.
 *       403:
 *         description: Forbidden - Chỉ Agent hoặc Admin được truy cập.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/customer-request/get-customer-request')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      const { page, limit, type, status } = req.query;
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };
      const filters = {
        type: type,
        status: status,
      };
      const { requests, total } = await propertyService.getCustomerRequests(
        pagination,
        filters
      );
      return res.status(200).json({
        data: {
          request: requests,
          pagination: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
          },
        },
        message: 'Success',
        error: null,
      });
    }
  );

/**
 * @openapi
 * /prop/accept-delete-request:
 *   post:
 *     tags:
 *       - Customer request
 *     security:
 *       - bearerAuth: []
 *     summary: Chấp nhận yêu cầu xóa BĐS của khách hàng [Admin]
 *     description: API cho **Admin** duyệt yêu cầu xóa một bài đăng BĐS.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 77
 *     responses:
 *       200:
 *         description: Yêu cầu xóa đã được chấp nhận thành công.
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc token không hợp lệ.
 *       403:
 *         description: Forbidden - Chỉ Admin được thực hiện hành động này.
 *       404:
 *         description: Không tìm thấy request.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/accept-delete-request')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { request_id } = req.body;
    const request = await propertyService.acceptDeleteRequest(request_id);
    const requestStatus = propertyService.getRequestStatusFromRequestPostStatus(
      RequestPostStatus.HIDDEN
    );
    await propertyService.updateStatusOfPostProperty(
      request.property_id,
      requestStatus,
      RequestPostStatus.HIDDEN
    );
    return res.status(200).json({
      data: null,
      message: 'Success',
      error: null,
    });
  });

/**
 * @openapi
 * /prop/customer-request/get-my-request:
 *   get:
 *     tags:
 *       - Customer request
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách yêu cầu của chính khách hàng đang đăng nhập [Customer]
 *     description: API cho phép **Customer** xem tất cả yêu cầu mà họ đã gửi (ví dụ yêu cầu xóa, chỉnh sửa).
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang.
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: enum
 *           enum: [delete, update]
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: enum
 *           enum: [pending, completed]
 *         description: Lọc theo trạng thái yêu cầu.
 *     responses:
 *       200:
 *         description: Thành công - trả về danh sách yêu cầu của chính khách hàng đang đăng nhập.
 *       401:
 *         description: Unauthorized - khách hàng chưa đăng nhập hoặc token không hợp lệ.
 *       403:
 *         description: Forbidden - chỉ Customer được phép gọi API này.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/customer-request/get-my-request')
  .get(authMiddleware, roleGuard([RoleName.Customer]), async (req, res) => {
    const { page = 1, limit = 10, type, status } = req.query;
    const pagination = {
      page: Number(page),
      limit: Number(limit),
    };
    const filters = {
      type: type,
      status: status,
      customer_id: req.user.userId,
    };
    const { requests, total } = await propertyService.getMyCustomerRequests(
      filters,
      pagination
    );
    return res.status(200).json({
      data: {
        request: requests,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
      message: 'Success',
      error: null,
    });
  });

export default router;
