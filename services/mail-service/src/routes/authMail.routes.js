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

router.post('/resetPasswordOTP', async (req, res) => {
  const { email, otp, name } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Email and OTP are required'],
    });
  }
  try {
    await authMailService.sendResetPasswordOTP({ email, otp, name });
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

// NEW: Send consignment request confirmation to customer
router.post('/sendConsignmentRequestToCustomer', async (req, res) => {
  const { email, name, propertyInfo, status } = req.body;
  if (!email || !name || !propertyInfo) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Email, name, and propertyInfo are required'],
    });
  }
  try {
    await authMailService.sendConsignmentRequestToCustomer({
      email,
      name,
      propertyInfo,
      status,
    });
    res.status(200).json({
      data: null,
      message: 'Consignment request confirmation sent to customer',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send email to customer',
      error: [error.message],
    });
  }
});

// NEW: Send consignment request notification to admin
router.post('/sendConsignmentRequestToAdmin', async (req, res) => {
  const { adminEmail, propertyInfo, customerInfo } = req.body;
  if (!adminEmail || !propertyInfo || !customerInfo) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['adminEmail, propertyInfo, and customerInfo are required'],
    });
  }
  try {
    await authMailService.sendConsignmentRequestToAdmin({
      adminEmail,
      propertyInfo,
      customerInfo,
    });
    res.status(200).json({
      data: null,
      message: 'Consignment request notification sent to admin',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send email to admin',
      error: [error.message],
    });
  }
});

// NEW: Send consignment request notifications to agents (batch)
router.post('/sendConsignmentRequestToAgents', async (req, res) => {
  const { propertyInfo, customerInfo, agentEmails } = req.body;
  if (!propertyInfo || !customerInfo) {
    return res.status(400).json({
      data: null,
      message: '',
      error: ['propertyInfo and customerInfo are required'],
    });
  }
  try {
    await authMailService.sendConsignmentRequestToAgents({
      propertyInfo,
      customerInfo,
      agentEmails,
    });
    res.status(200).json({
      data: null,
      message: 'Consignment request notifications sent to agents',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send email to agents',
      error: [error.message],
    });
  }
});

export default router;
