import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import commissionService from '../services/commission.service.js';

// model commissions {
//   id           Int        @id @default(autoincrement())
//   property_id  Int
//   status       CommissionStatus @default(processing)
//   type         CommissionType @default(buying)
//   commission   Decimal    @db.Decimal(15, 2)
//   latest_price Decimal?   @db.Decimal(15, 2)
//   contract_url String?
//   created_at   DateTime   @default(now())
//   updated_at   DateTime   @default(now())
// }

//create new record for commission
router.post(
  '/',
  authMiddleware,
  roleGuard([RoleName.Admin, RoleName.Agent]),
  async (req, res) => {
    const {
      property_id,
      status,
      type,
      commission,
      latest_price,
      contract_url,
    } = req.body;
    if (!property_id || !status || !type || !commission) {
      return res.status(400).json({
        data: null,
        message: '',
        error: ['Missing required fields'],
      });
    }
    const commissionRecord = await commissionService.createCommission({
      property_id,
      status,
      type,
      commission,
      latest_price,
      contract_url,
    });
    return res.status(201).json({
      data: commissionRecord,
      message: 'Commission record created successfully',
      error: null,
    });
  }
);

export default router;
