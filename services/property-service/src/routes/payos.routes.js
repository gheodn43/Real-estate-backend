import express from 'express';
import paymentService from '../services/payos.service.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
const router = express.Router();

/**
 * @openapi
 * /prop/payos/create-payment/{id}:
 *   post:
 *     tags:
 *       - Property
 *     security:
 *       - bearerAuth: []
 *     summary: Khởi tạo link thanh toán[ Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài đăng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commission_id:
 *                 type: integer
 *                 example: 1
 *               last_price:
 *                 type: number
 *                 example: 1000000
 *               commission:
 *                 type: number
 *                 format: double
 *                 example: 10
 *               contract_url:
 *                 type: string
 *                 example: 'http://example.com/contract.pdf'
 *     responses:
 *       200:
 *         description: Giao dịch của bài đăng đã được hoàn thành
 */
router.post(
  '/create-payment/:id',
  authMiddleware,
  roleGuard([RoleName.Agent]),
  async (req, res) => {
    const { commission_id, last_price, commission, contract_url } = req.body;
    const { id } = req.params;
    const user = req.user;
    if (contract_url === null) {
      return res.status(400).json({
        data: null,
        message: '',
        error: ['Missing contract_url'],
      });
    }
    const property_id = id;
    const commisionData = {
      agent_id: user.userId,
      commission_id,
      last_price,
      commission,
      contract_url,
    };
    try {
      const result = await paymentService.createPayment(
        property_id,
        commisionData
      );
      return res.status(200).json({
        data: result,
        message: '',
        error: ['Ditme tạo link thanh cong'],
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post('/weebhook', async (req, res) => {
  const { data, signature, code, success } = req.body;
  const isValidSignature = await paymentService.isValidSignature(
    data,
    signature
  );
  const orderCode = data.orderCode;
  if (isValidSignature) {
    await paymentService.handleCancelPayment(orderCode);
  }
  if (success && code === '00' && data.code === '00') {
    await paymentService.handleSuccessPayment(orderCode);
  }
  res.sendStatus(200);
});

export default router;
