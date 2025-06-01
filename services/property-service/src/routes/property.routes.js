import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import propertyService from '../services/property.service.js';
import locationService from '../services/location.service.js';
import mediaService from '../services/media.service.js';
import detailPropertyService from '../services/category.detail.service.js';
import amenityService from '../services/amentity.service.js';

import { getProfile, getCustomerProfile } from '../helpers/authClient.js';

router
  .route('/request')
  .post(authMiddleware, roleGuard([RoleName.Customer]), async (req, res) => {
    try {
      const {
        senderId,
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
        await locationService.createLocation({
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

router
  .route('/assign-agent')
  .post(
    authMiddleware,
    roleGuard([RoleName.Customer, RoleName.Admin]),
    async (req, res) => {
      try {
        const { property, location, agents } = req.body;
        const userRole = req.user.userRole;
        const token = req.token;

        let customerProfile = null;
        if (userRole === RoleName.Admin && property.sender_id) {
          customerProfile = await getCustomerProfile(property.sender_id, token);
        } else {
          customerProfile = await getProfile(token);
        }

        await propertyService.assignAgentToRequest(
          property,
          location,
          agents,
          customerProfile
        );

        return res.status(200).json({
          data: null,
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

export default router;
