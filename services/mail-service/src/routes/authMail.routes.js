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

router.post('/sendConsignmentRequestToCustomer', async (req, res) => {
  const { property, location, customer } = req.body;
  try {
    await authMailService.sendConsignmentRequestToCustomer({
      property,
      location,
      customer,
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

router.post('/sendConsignmentRequestToAdmin', async (req, res) => {
  const { property, location, customer } = req.body;
  try {
    await authMailService.sendConsignmentRequestToAdmin({
      property,
      location,
      customer,
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

router.post('/notifyAgentAssignedToProject', async (req, res) => {
  const { property, agents, customer } = req.body;
  const location =
    property && property.locations ? { ...property.locations } : {};
  try {
    await authMailService.notifyAgentAssignedToProject({
      property,
      location,
      agents,
      customer,
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

router.post('/agent-review/notify', async (req, res) => {
  const { agent_id, user_id, review_id, rating, comment } = req.body;
  try {
    await authMailService.sendAgentReviewNotification({
      agent_id,
      user_id,
      review_id,
      rating,
      comment,
    });
    res.status(200).json({
      data: null,
      message: 'Agent review notification sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send agent review notification',
      error: [error.message],
    });
  }
});

router.post('/agent-review/admin-notify', async (req, res) => {
  const { review_id, reply_id, agent_id, comment } = req.body;
  try {
    await authMailService.sendAdminReviewNotification({
      review_id,
      reply_id,
      agent_id,
      comment,
    });
    res.status(200).json({
      data: null,
      message: 'Admin review notification sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send admin review notification',
      error: [error.message],
    });
  }
});

router.post('/agent-review/approved', async (req, res) => {
  const { review_id, reply_id, agent_id } = req.body;
  try {
    await authMailService.sendApprovedReplyNotification({
      review_id,
      reply_id,
      agent_id,
    });
    res.status(200).json({
      data: null,
      message: 'Approved reply notification sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send approved reply notification',
      error: [error.message],
    });
  }
});

router.post('/agent-review/rejected', async (req, res) => {
  const { review_id, reply_id, agent_id } = req.body;
  try {
    await authMailService.sendRejectedReplyNotification({
      review_id,
      reply_id,
      agent_id,
    });
    res.status(200).json({
      data: null,
      message: 'Rejected reply notification sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send rejected reply notification',
      error: [error.message],
    });
  }
});

router.post('/agent-review/user-notify', async (req, res) => {
  const { review_id, reply_id, user_id } = req.body;
  try {
    await authMailService.sendUserReplyNotification({
      review_id,
      reply_id,
      user_id,
    });
    res.status(200).json({
      data: null,
      message: 'User reply notification sent successfully',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Failed to send user reply notification',
      error: [error.message],
    });
  }
});

export default router;
