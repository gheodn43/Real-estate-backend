import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import { createProperty } from '../services/property.service.js';

/**
 * @swagger
 * /prop:
 *   post:
 *     summary: Create a new property
 *     description: Creates a new property in the system. Requires authentication via Bearer token.
 *     tags: [Properties]
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
 *               - price
 *               - addr_city
 *               - addr_district
 *               - addr_street
 *               - user_id
 *               - type_id
 *               - status_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the property
 *                 example: "Luxury Apartment"
 *               description:
 *                 type: string
 *                 description: Description of the property
 *                 example: "A beautiful apartment in the city center"
 *               price:
 *                 type: number
 *                 description: Price of the property
 *                 example: 1500000
 *               addr_city:
 *                 type: string
 *                 description: City of the property
 *                 example: "Ho Chi Minh"
 *               addr_district:
 *                 type: string
 *                 description: District of the property
 *                 example: "District 1"
 *               addr_street:
 *                 type: string
 *                 description: Street of the property
 *                 example: "Nguyen Hue"
 *               addr_details:
 *                 type: string
 *                 description: Additional address details
 *                 example: "Apartment 5B"
 *               latitude:
 *                 type: number
 *                 description: Latitude of the property location
 *                 example: 10.7769
 *               longitude:
 *                 type: number
 *                 description: Longitude of the property location
 *                 example: 106.7009
 *               user_id:
 *                 type: integer
 *                 description: ID of the user who owns the property
 *                 example: 1
 *               type_id:
 *                 type: integer
 *                 description: ID of the property type
 *                 example: 1
 *               status_id:
 *                 type: integer
 *                 description: ID of the property status
 *                 example: 1
 *     responses:
 *       201:
 *         description: Property created successfully
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
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         title:
 *                           type: string
 *                           example: "Luxury Apartment"
 *                         price:
 *                           type: number
 *                           example: 1500000
 *                 message:
 *                   type: string
 *                   example: "Property created"
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: ""
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Unauthorized"]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: ""
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Failed to create property"]
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newProperty = req.body;
    const property = await createProperty(newProperty);
    res.status(201).json({
      data: {
        property: property,
      },
      message: 'Property created',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: '',
      error: ['Failed to create property'],
    });
  }
});

export default router;
