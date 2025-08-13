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
      const userData = req.user;
      const propertyTypes = await dashboardService.getPropertyType(
        filter,
        userData
      );
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

/**
 * @openapi
 * /prop/dashboard/revenue:
 *   get:
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy doanh thu của rental và buying trong 12 tháng [ADMIN, AGENT]
 *     parameters:
 *       - in: query
 *         name: mooc_date
 *         schema:
 *           type: string
 *           format: date
 *           example: 23/08/2025
 *         description: Ngày làm mốc tham chiếu (dd/MM/yyyy)
 *       - in: query
 *         name: month_lenght
 *         schema:
 *           type: number
 *           example: 12
 *         description: khoảng thời gian muốn lấy (số tháng)
 *     responses:
 *       200:
 *         description: Thống kê loại BĐS trong khoảng thời gian.
 */
router
  .route('/revenue')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const { mooc_date, month_lenght } = req.query;
      const filter = {
        mooc_date: parseClientDate(mooc_date),
        month_lenght,
      };
      const userData = req.user;
      const propertyTypes = await dashboardService.getRevenueWithType(
        filter,
        userData
      );
      res.status(200).json({
        data: propertyTypes,
        message: 'Property types found',
        error: [],
      });
    }
  );

/**
 * @openapi
 * /prop/dashboard/top-3-agents:
 *   get:
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy doanh thu của rental và buying trong 12 tháng [ADMIN, AGENT]
 *     parameters:
 *       - in: query
 *         name: mooc_date
 *         schema:
 *           type: string
 *           format: date
 *           example: 23/08/2025
 *         description: Ngày làm mốc tham chiếu (dd/MM/yyyy)
 *     responses:
 *       200:
 *         description: Thống kê loại BĐS trong khoảng thời gian.
 */
router
  .route('/top-3-agents')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const { mooc_date } = req.query;
      const filter = {
        mooc_date: parseClientDate(mooc_date),
      };
      const token = req.token;
      const propertyTypes = await dashboardService.getTop3AgentsInMonth(
        filter,
        token
      );
      res.status(200).json({
        data: propertyTypes,
        message: 'Property types found',
        error: [],
      });
    }
  );

export default router;
