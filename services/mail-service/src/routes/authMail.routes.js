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

router.post('/notifyAgentNewReview', async (req, res) => {
  try {
    await authMailService.notifyAgentNewReview(req.body);
    res.status(200).json({
      data: {},
      message: 'Agent notified of new review',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: {},
      message: 'Failed to notify agent',
      error: [error.message],
    });
  }
});

router.post('/notifyAgentReviewUpdated', async (req, res) => {
  const { agentEmail, agentName, review, reviewer } = req.body;
  try {
    await authMailService.sendAgentReviewUpdatedNotify({ agentEmail, agentName, review, reviewer });
    res.status(200).json({
      data: {},
      message: 'Agent notified of review updated',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: {},
      message: 'Failed to notify agent',
      error: [error.message],
    });
  }
});

router.post('/notifyAdminAgentReply', async (req, res) => {
  const { adminEmail, adminName, reply, agent, review } = req.body;
  try {
    await authMailService.sendAgentReplyAdminNotify({ adminEmail, adminName, reply, agent, review });
    res.status(200).json({
      data: {},
      message: 'Admin notified of agent reply',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: {},
      message: 'Failed to notify admin',
      error: [error.message],
    });
  }
});

router.post('/notifyAgentReplyApproved', async (req, res) => {
  const { agentEmail, agentName } = req.body;
  try {
    await authMailService.sendAgentReplyApproved({ agentEmail, agentName });
    res.status(200).json({ 
      data: {}, 
      message: 'Agent notified of reply approval', 
      error: [] });
  } catch (error) {
    res.status(500).json({ 
      data: {}, 
      message: 'Failed to notify agent', 
      error: [error.message] });
  }
});

router.post('/notifyAgentReplyRejected', async (req, res) => {
  const { agentEmail, agentName } = req.body;
  try {
    await authMailService.sendAgentReplyRejected({ agentEmail, agentName });
    res.status(200).json({ 
      data: {}, 
      message: 'Agent notified of reply rejection', 
      error: [] });
  } catch (error) {
    res.status(500).json({ 
      data: {}, 
      message: 'Failed to notify agent', 
      error: [error.message] });
  }
});

router.post('/notifyUserAdminReply', async (req, res) => {
  const { userEmail, userName, reply, review, admin } = req.body;
  try {
    await authMailService.sendAdminReplyUserNotify({ userEmail, userName, comment: reply.comment, admin: { name: admin.name, email: admin.email }, review });
    res.status(200).json({
      data: {},
      message: 'User notified of admin reply',
      error: [],
    });
  } catch (error) {
    res.status(500).json({
      data: {},
      message: 'Failed to notify user',
      error: [error.message],
    });
  }
});

export default router;