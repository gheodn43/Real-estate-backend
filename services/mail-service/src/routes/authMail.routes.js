import express from 'express';
const router = express.Router();
import authMailService from '../services/authMail.service.js';

router.post('/verifyOTP', async (req, res) => {
  const { email, otp, name } = req.body;
  if (!email || !otp || !name) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Email and OTP are required'],
    });
  }
  try {
    await authMailService.sendRegisterOTP({ email, otp, name });
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

router.post('/sendPassword', async (req, res) => {
  const { email, password, name, roleName } = req.body;
  if (!email || !password || !name || !roleName) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Email and password are required'],
    });
  }
  try {
    await authMailService.sendPasswordEmail({
      email,
      password,
      name,
      roleName,
    });
    res.status(200).json({
      data: null,
      message: 'Password sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send password',
      error: [error.message],
    });
  }
});
export default router;
