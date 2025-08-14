import express from 'express';
import { createPayment, isValidSignature } from '../services/payos.service.js';

const router = express.Router();

/**
 * @swagger
 * /prop/payos/create-payment:
 *   post:
 *     summary: Tạo link thanh toán PayOS và trả về QR Code
 *     tags: [PayOS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, description]
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Link thanh toán và QR Code
 */

router.post('/create-payment', async (req, res) => {
  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ message: 'Missing amount or description' });
  }
  try {
    const result = await createPayment(amount, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/weebhook', async (req, res) => {
  const { data, signature, code, success } = req.body;
  if (!isValidSignature(data, signature)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  if (success && code === '00' && data.code === '00') {
    console.log(`Order ${data.orderCode} đã thanh toán thành công`);
  }
  res.sendStatus(200);
});

export default router;
