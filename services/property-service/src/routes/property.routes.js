import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import propertyService from '../services/property.service.js';
import locationService from '../services/location.service.js';
import mediaService from '../services/media.service.js';
import detailPropertyService from '../services/category.detail.service.js';
import amenityService from '../services/amentity.service.js';
import agentHistory from '../services/propertyAgentHistory.service.js';

import { getProfile, getCustomerProfile } from '../helpers/authClient.js';

/**
 * @swagger
 * /prop/request:
 *   post:
 *     summary: Gửi yêu cầu ký gửi bất động sản
 *     description: API để khách hàng gửi yêu cầu ký gửi bất động sản
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
 *               - senderId
 *               - title
 *               - description
 *               - beforePriceTag
 *               - price
 *               - afterPriceTag
 *               - assetsId
 *               - needsId
 *               - stage
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
 *               stage:
 *                 type: string
 *                 example: request
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
 *                       example: https://example.com/image1.jpg
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
 *     responses:
 *       201:
 *         description: Property request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     property:
 *                       type: object
 *                     location:
 *                       type: object
 *                     media:
 *                       type: array
 *                       items:
 *                         type: object
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                   example: Property created
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       400:
 *         description: Property creation failed
 *       500:
 *         description: Server error
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
        stage,
        location,
        media,
        details,
        amenities,
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
        stage,
      });

      if (!property) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Property not created'],
        });
      }
      const propertyId = property.id;
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
      await propertyService.notifyNewPropertySubmission(
        property,
        location,
        user
      );
      return res.status(201).json({
        data: {
          property: property,
          location: location,
          media: media,
          amenities: amenities,
          details: details,
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
 * /prop/assign-agent:
 *   post:
 *     summary: Gán bất động sản cho các agent
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
 *                   type: object
 *                   required:
 *                     - id
 *                     - gmail
 *                     - name
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     gmail:
 *                       type: string
 *                       format: email
 *                       example: agent@gmail.com
 *                     name:
 *                       type: string
 *                       example: agent name
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
        const propertyAgentHistories =
          await propertyService.assignAgentToRequest(
            basicPropertyInfo,
            agents,
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

// agent/admin tạo mới hoặc cập nhật bất động sản với stage là post và RequestPostStatus là pending_approval
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
        } = req.body;

        const user = req.user;
        const senderId = user.userId;

        let property = null;
        let locationSaved = null;
        let mediaSaved = null;
        let detailsSaved = null;
        let amenitiesSaved = null;

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
          await propertyService.createHistory({
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

// agent/admin cập nhật bất động sản với stage là post và RequestPostStatus là pending_approval
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

        // AGENT: chỉ được sửa bài của mình + bài ở trạng thái DRAFT
        if (user.userRole === RoleName.Agent) {
          const isAgentOwner = agentHistory.verifyOwnerPost(user.userId, id);
          if (!isAgentOwner) {
            return res.status(403).json({
              data: null,
              message: '',
              error: ['You are not allowed to update this property'],
            });
          }

          if (property.requestPostStatus === RequestPostStatus.PUBLISHED) {
            return res.status(400).json({
              data: null,
              message: '',
              error: [
                'Cannot update published posts, must have admin approval',
              ],
            });
          }

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
        property = await propertyService.updatePostProperty(id, {
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

// admin/agent lấy chi tiết 1 bất động sản để phục vụ cho update
router
  .route('/post/:id')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const user = req.user;
        const property = await propertyService.getById(id);
        if (!property) {
          return res.status(404).json({
            data: null,
            message: '',
            error: ['Property not found'],
          });
        }
        // AGENT: chỉ được xem bài của mình
        if (user.userRole === RoleName.Agent) {
          const isAgentOwner = agentHistory.verifyOwnerPost(user.userId, id);
          if (!isAgentOwner) {
            return res.status(403).json({
              data: null,
              message: '',
              error: ['You are not allowed to view this property'],
            });
          }
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
    }
  );

// admin/agent lấy danh sách các property đang nháp
router
  .route('/post/draft')
  .get(
    authMiddleware,
    roleGuard([RoleName.Agent, RoleName.Admin]),
    async (req, res) => {
      try {
        const user = req.user;
        const properties = await propertyService.getDraftProperties(
          user.userId
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

// Lấy danh sách sơ lược của bđs theo toạ độ user với tham số là bán kính
// Lấy danh sách sơ lược của bđs theo category

export default router;
