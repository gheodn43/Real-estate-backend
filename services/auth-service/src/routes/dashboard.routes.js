const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/authenticateToken');
const roleGuard = require('../middleware/roleGuard');

/**
 * @swagger
 * /auth/dashboard/total-customer:
 *   get:
 *     summary: Update user location
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Missing latitude or longitude
 */
router.get(
  '/total-customer',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin, roleGuard.RoleName.Agent]),
  authController.getTotalCustomer
);

/**
 * @swagger
 * /auth/dashboard/statistics-one-year:
 *   get:
 *     summary: Update user location
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Missing latitude or longitude
 */
router.get(
  '/statistics-one-year',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin, roleGuard.RoleName.Agent]),
  authController.getMonthlyNewCustomers
);

/**
 * @swagger
 * /auth/dashboard/users:
 *   get:
 *     summary: Get list of users [ADMIN, AGENT]
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or phone
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filter by role ID
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No users found
 *       500:
 *         description: Server error
 */
router.get(
  '/users',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin, roleGuard.RoleName.Agent]),

  authController.getListUsers
);

/**
 * @swagger
 * /auth/dashboard/users/{id}:
 *   get:
 *     summary: Get user details by ID [ADMIN, AGENT]
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/users/:id',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin, roleGuard.RoleName.Agent]),
  authController.getDetailUser
);

module.exports = router;
