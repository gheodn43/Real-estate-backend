const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');


/**
 * @swagger
 * /auth/admin/create-user:
 *   post:
 *     summary: Admin tạo tài khoản Broker hoặc Journalist
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               roleName:
 *                 type: string
 *                 enum: [Broker, Journalist]
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
router.post('/create-user', adminController.createUserByAdmin);

module.exports = router;