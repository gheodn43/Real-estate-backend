import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
const router = express.Router();

/**
 * @openapi
 * /prop/upload:
 *   post:
 *     tags:
 *       - Upload file
 *     summary: Upload image
 *     description: Upload image to cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload image success
 *       400:
 *         description: Upload image failed
 */
router.post(
  '/',
  authMiddleware,
  roleGuard([
    RoleName.Admin,
    RoleName.Agent,
    RoleName.Customer,
    RoleName.Journalist,
  ]),
  async (req, res) => {
    try {
      const file = req.files.file;
      const formData = new FormData();
      formData.append('file', file.data, {
        filename: file.name,
        contentType: file.mimetype,
      });
      formData.append('upload_preset', 'qiftmtgr');

      const result = await axios.post(
        'https://api.cloudinary.com/v1_1/dln9xmmqe/image/upload',
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      res.status(200).json({
        data: {
          url: result.data.secure_url,
        },
        message: 'Upload image success',
        error: [],
      });
    } catch (error) {
      console.error(error.response?.data || error.message);
      res
        .status(500)
        .json({ error: 'Failed to upload image', detail: error.message });
    }
  }
);

export default router;
