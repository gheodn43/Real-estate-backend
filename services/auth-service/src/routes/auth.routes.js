const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/authenticateToken');
const roleGuard = require('../middleware/roleGuard');

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */

router.get('/google', authController.googleLogin);
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend with token
 */

router.get('/google/callback', ...authController.googleCallback);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

router.post('/logout', authenticateToken, authController.logout);
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Missing or invalid registration information
 */

router.post('/register', authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
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
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing email or password
 */

router.post('/login', authController.login);
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verification successful
 *       400:
 *         description: OTP is incorrect or expired
 */

router.post('/verify-otp', authController.verifyOtp);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile (session)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not logged in
 */

router.get('/profile', authenticateToken, authController.getProfile);
/**
 * @swagger
 * /auth/profile-token:
 *   get:
 *     summary: Get user profile (JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */

router.get('/profile-token', authenticateToken, authController.getProfileToken);
/**
 * @swagger
 * /auth/update-location:
 *   post:
 *     summary: Update user location
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Missing latitude or longitude
 */

router.post(
  '/update-location',
  authenticateToken,
  authController.updateLocation
);
/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Missing or invalid information
 *       401:
 *         description: Not logged in
 */

router.put(
  '/change-password',
  authenticateToken,
  authController.changePassword
);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password (send OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent for password reset
 *       400:
 *         description: Missing email or email does not exist
 */

router.post('/forgot-password', authController.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Missing or invalid information
 */

router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               avatar:
 *                 type: string
 *               addr_city:
 *                 type: string
 *               addr_district:
 *                 type: string
 *               addr_street:
 *                 type: string
 *               addr_detail:
 *                 type: string
 *               number_phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Not logged in
 */
router.put('/update-profile', authenticateToken, authController.updateProfile);

/**
 * @swagger
 * /auth/update-internal-profile:
 *   put:
 *     summary: Update user profile [ADMIN]
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *               name:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               avatar:
 *                 type: string
 *               addr_city:
 *                 type: string
 *               addr_district:
 *                 type: string
 *               addr_street:
 *                 type: string
 *               addr_detail:
 *                 type: string
 *               number_phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Not logged in
 */
router.put(
  '/update-internal-profile',
  authenticateToken,
  roleGuard([roleGuard.RoleName.Admin]),
  authController.updateInternalProfile
);
/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Check if user exists (auto detect userId)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns authorized, userId, and userRole
 *       401:
 *         description: Unauthorized
 */
router.get('/verify', authenticateToken, authController.checkUserExists);

/**
 * @swagger
 * /auth/profile/{id}:
 *   get:
 *     summary: Get user profile by id (admin only)
 *     tags: [Auth]
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
 *         description: User profile
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile/:id', authenticateToken, authController.getProfileById);
/**
 * @swagger
 * /auth/public-list-agent:
 *   get:
 *     summary: Lấy danh sách agent [ALL ROLE]
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/public-list-agent', authController.getPublicListAgent);

/**
 * @swagger
 * /auth/public-list-journalist:
 *   get:
 *     summary: Lấy danh sách journalist [ALL ROLE]
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/public-list-journalist', authController.getPublicListJournalist);

router.get('/publish-agent-profile/:id', authController.getPublicAgent);
router.get(
  '/publish-journalist-profile/:id',
  authController.getPublicJouralist
);
router.get('/publish-customer-profile/:id', authController.getPublicCustomer);

router.post(
  '/get-user-from-list',
  authenticateToken,
  authController.getPublicListProperty
);

module.exports = router;
