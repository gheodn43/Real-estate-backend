import express from 'express';
const router = express.Router();
import authMailService from '../services/authMail.service.js';

router.post('/verifyOTP', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Email and OTP are required'],
    });
  }
  try {
    await authMailService.sendRegisterOTP({ email, otp });
    res.status(200).json({
      data: null,
      message: 'OTP sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send OTP',
      error: [error.message],
    });
  }
});
export default router;
