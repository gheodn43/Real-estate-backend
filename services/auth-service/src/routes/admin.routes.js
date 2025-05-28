const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const adminController = require('../controllers/admin.controller');
const roleGuard = require('../middleware/roleGuard');

/**
 * @swagger
 * /auth/admin/create-user:
 *   post:
 *     summary: Admin tạo tài khoản Broker hoặc Journalist
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               roleName:
 *                 type: string
 *                 enum: [Agent, Journalist]
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Missing or invalid data
 *       401:
 *         description: Not logged in
 *       403:
 *         description: Permission denied
 */
router.post(
  '/create-user',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin]),
  adminController.createUserByAdmin
);

module.exports = router;
