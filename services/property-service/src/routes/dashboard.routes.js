import express from 'express';
const router = express.Router();
import dashboardService from '../services/dashboard.service.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';

/**
 * @openapi
 * /prop/dashboard/property-type:
 *   get:
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy thống kê loại BĐS trong khoảng thời gian
 *     description: API cho **Admin** lấy thống kê loại BĐS trong khoảng thời gian.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 01/01/2023
 *         description: Ngày bắt đầu (dd/MM/yyyy)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 31/12/2023
 *         description: Ngày kết thúc (dd/MM/yyyy)
 *     responses:
 *       200:
 *         description: Thống kê loại BĐS trong khoảng thời gian.
 */

router
  .route('/property-type')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const { startDate, endDate } = req.query;
      const filter = {
        start_date: parseClientDate(startDate),
        end_date: parseClientDate(endDate),
      };
      const propertyTypes = await dashboardService.getPropertyType(filter);
      res.status(200).json({
        data: propertyTypes,
        message: 'Property types found',
        error: [],
      });
    }
  );

const parseClientDate = (dateString) => {
  if (!dateString) return undefined;
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0);
};

export default router;
