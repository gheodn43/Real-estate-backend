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

module.exports = router;
