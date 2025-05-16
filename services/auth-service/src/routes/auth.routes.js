const express = require('express');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const router = express.Router();

function generateToken(user) {
  return jwt.sign({ 
    id: user.id, 
    email: user.email, 
    name: user.name }, 
    JWT_SECRET, { expiresIn: '1h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ 
    data: null,
    message: 'No token provided.',
    errors: []
  });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ 
      data: null,
      message: 'Invalid token.',
      errors: []
    });
    req.user = user;
    next();
  });
}
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend with token
 */

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`/index.html?token=${token}`);
    } catch (err) {
      res.status(500).json({ 
        data: null,
        message: 'Server error', 
        error: [err.message] 
      });
    }
  }
);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */

router.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return res.sendStatus(500); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
});
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Missing or invalid registration information
 */

router.post('/register', async (req, res) => {
  if (!req.session.otpVerified) {
    return res.status(400).json({ 
      data: null,
      message: 'You need to verify OTP before registering.',
      errors: []
    });
  }
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ 
      data: null,
      message: 'Missing registration information.' ,
      errors: []
    });
  }
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ 
      data: null,
      message: 'Password is too weak. Please choose a stronger password (including uppercase, lowercase, numbers, special characters, at least 8 characters).',
      errors: []
    });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.googleId) {
        return res.status(400).json({ 
          data: null,
          message: 'This email has been used to login with Google, cannot register with this email.',
          errors: [] 
        });
      } else {
        return res.status(400).json({
           data: null,
           message: 'This email has already been registered.' ,
           errors: []
          });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role_id: 1
      }
    });
    res.status(201).json({ 
      data:null,
      message: 'Registration successful', 
      user: { id: newUser.id, 
              email: newUser.email, 
              name: newUser.name },
      errors: []
     });
    delete req.session.otpVerified;
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Server error', 
      error: [err.message]
    });
  }
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing email or password
 */

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: 'Missing email or password',
      errors: ['Missing email or password']
    });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(400).json({
        data: null,
        message: 'Incorrect email or password',
        errors: ['Incorrect email or password']
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        data: null,
        message: 'Incorrect email or password',
        errors: ['Incorrect email or password']
      });
    }
    req.session.userId = user.id;
    const expiresIn = 604800;
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name }, 
      JWT_SECRET, { expiresIn });
    res.json({
      data: {
        token: {
          expiresIn,
          accessToken: token
        }
      },
      message: 'Successfully',
      errors: []
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      data: null,
      message: 'Server error',
      errors: [err.message]
    });
  }
});
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verification successful
 *       400:
 *         description: OTP is incorrect or expired
 */

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (req.session.otp === otp && req.session.otpEmail === email) {
    req.session.otpVerified = true;
    delete req.session.otp;
    delete req.session.otpEmail;
    res.json({
       data: null,
       message: 'OTP verification successful!' ,
       errors: []
      });
  } else {
    res.status(400).json({ 
      data: null,
      message: 'OTP is incorrect or has expired.' ,
      errors: []
    });
  }
});

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Missing email
 */

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ 
      data: null,
      message: 'Missing email' ,
      errors: []
    });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.otpEmail = email;
    res.status(200).json({
       data: null,
       message: 'OTP has been sent to your email. Please verify.' ,
       errors: []
      });
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Send email error', 
      error: [err.message]
    });
  }
});
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile (session)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not logged in
 */

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      data: null,
      message: 'Not logged in' ,
      errors: []
    });
  }
  try {
    const user = await prisma.user.findUnique({ 
      where: { 
        id: req.session.userId 
      } 
    });
    if (!user) return res.status(404).json({ 
      data: null,
      message: 'User not found.' ,
      errors: []
    });
    res.json({ user: { 
      id: user.id, 
      email: user.email, 
      name: user.name } 
    });
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Server error', 
      error: [err.message] 
    });
  }
});
/**
 * @swagger
 * /auth/profile-token:
 *   get:
 *     summary: Get user profile (JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */

router.get('/profile-token', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      latitude: user.latitude, 
      longitude: user.longitude } 
    });
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Server error', error: err.message ,
      errors: []
    });
  }
});
/**
 * @swagger
 * /auth/update-location:
 *   post:
 *     summary: Update user location
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Missing latitude or longitude
 */

router.post('/update-location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        data: null,
        message: 'Missing latitude or longitude.',
        errors: []
       });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    res.json({
      message: 'Location updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Server error', error: err.message ,
      errors: []
    });
  }
});

async function sendOTP(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'realestate14052025@gmail.com',
      pass: 'lbjv ijzq wfzy jhxk'
    }
  });
  await transporter.sendMail({
    from: 'realestate14052025@gmail.com',
    to: email,
    subject: 'OTP Verification Code',
    text: `Your OTP code is: ${otp}`
  });
}
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Missing or invalid information
 *       401:
 *         description: Not logged in
 */

router.post('/change-password', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      data: null,
      message: 'You need to login.' ,
      errors: []
    });
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      data: null,
      message: 'Missing information.',
      errors: []
     });
  }
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(404).json({ 
    data: null,
    message: 'User not found.',
    errors: []
   });
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ 
    data: null,
    message: 'Old password is incorrect.',
    errors: []
   });
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ 
      data: null,
      message: 'New password is too weak.',
      errors: []
     });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { 
    id: user.id }, 
    data: { password: hashed } 
  });
  res.json({
    data: null, 
    message: 'Password changed successfully.',
    errors: []
   });
});
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password (send OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent for password reset
 *       400:
 *         description: Missing email or email does not exist
 */

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ 
    data: null,
    message: 'Missing email.',
    errors: []
   });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ 
    data: null,
    message: 'Email does not exist.',
    errors: []
   });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.resetOtp = otp;
    req.session.resetEmail = email;
    res.json({ 
      data: null,
      message: 'OTP for password reset has been sent.',
      errors: []
     });
  } catch (err) {
    res.status(500).json({ 
      data: null,
      message: 'Send OTP error.', error: err.message,
      errors: []
     });
  }
});
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Missing or invalid information
 */

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ 
      data: null,
      message: 'Missing information.',
      errors: []
     });
  }
  if (req.session.resetOtp !== otp || req.session.resetEmail !== email) {
    return res.status(400).json({ 
      data: null,
      message: 'OTP is incorrect or has expired.',
      errors: []
     });
  }
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ 
      data: null,
      message: 'New password is too weak.',
      errors: []
     });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ 
    where: { email }, 
    data: { password: hashed } 
  });
  delete req.session.resetOtp;
  delete req.session.resetEmail;
  res.json({ message: 'Password reset successful.' });
});

module.exports = router;