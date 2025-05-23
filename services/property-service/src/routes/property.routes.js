const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Retrieve a list of properties
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter properties by city
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter properties by district
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: integer
 *         description: Filter by property type ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of properties per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, created_at]
 *         description: Sort by price or creation date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: A list of properties with related data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       addr_city:
 *                         type: string
 *                       addr_district:
 *                         type: string
 *                       addr_street:
 *                         type: string
 *                       addr_details:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       user_id:
 *                         type: integer
 *                       type_id:
 *                         type: integer
 *                       status_id:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       property_type:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       property_status:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       property_category_mappings:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             category:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/properties', async (req, res) => {
  try {
    const {
      city,
      district,
      minPrice,
      maxPrice,
      typeId,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      order = 'desc',
    } = req.query;

    const where = {};
    if (city) where.addr_city = { contains: city, mode: 'insensitive' };
    if (district)
      where.addr_district = { contains: district, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (typeId) where.type_id = parseInt(typeId);

    const orderBy = {};
    if (sortBy === 'price' || sortBy === 'created_at') {
      orderBy[sortBy] = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [properties, total] = await Promise.all([
      prisma.properties.findMany({
        where,
        include: {
          property_type: { select: { id: true, name: true } },
          property_status: { select: { id: true, name: true } },
          property_category_mappings: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.properties.count({ where }),
    ]);

    res.json({
      data: properties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
