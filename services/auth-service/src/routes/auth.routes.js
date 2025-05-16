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
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
}

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

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
      console.error('Error in /google/callback:', err.message);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

router.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return res.sendStatus(500); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
});

router.post('/register', async (req, res) => {
  // Check if OTP verification is required
  if (!req.session.otpVerified) {
    return res.status(400).json({ message: 'You need to verify OTP before registering.' });
  }
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing registration information.' });
  }
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'Password is too weak. Please choose a stronger password (including uppercase, lowercase, numbers, special characters, at least 8 characters).' });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.googleId) {
        return res.status(400).json({ message: 'This email has been used to login with Google, cannot register with this email.' });
      } else {
        return res.status(400).json({ message: 'This email has already been registered.' });
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
    res.status(201).json({ message: 'Registration successful', user: { id: newUser.id, email: newUser.email, name: newUser.name } });
    delete req.session.otpVerified;
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn });
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

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (req.session.otp === otp && req.session.otpEmail === email) {
    req.session.otpVerified = true;
    delete req.session.otp;
    delete req.session.otpEmail;
    res.json({ message: 'OTP verification successful!' });
  } else {
    res.status(400).json({ message: 'OTP is incorrect or has expired.' });
  }
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Missing email' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.otpEmail = email;
    console.log(`OTP ${otp} sent to ${email}`);
    res.status(200).json({ message: 'OTP has been sent to your email. Please verify.' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Send email error', error: err.message });
  }
});

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/profile-token', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, latitude: user.latitude, longitude: user.longitude } });
  } catch (err) {
    console.error('Get profile-token error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/update-location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Missing latitude or longitude.' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    console.log(`Updated location for user ${req.user.id}: lat=${latitude}, lng=${longitude}`);
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
    console.error('Update location error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
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

router.post('/change-password', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'You need to login.' });
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing information.' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect.' });
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'New password is too weak.' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  res.json({ message: 'Password changed successfully.' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Missing email.' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Email does not exist.' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.resetOtp = otp;
    req.session.resetEmail = email;
    res.json({ message: 'OTP for password reset has been sent.' });
  } catch (err) {
    console.error('Send forgot password OTP error:', err.message);
    res.status(500).json({ message: 'Send OTP error.', error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Missing information.' });
  }
  if (req.session.resetOtp !== otp || req.session.resetEmail !== email) {
    return res.status(400).json({ message: 'OTP is incorrect or has expired.' });
  }
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'New password is too weak.' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  delete req.session.resetOtp;
  delete req.session.resetEmail;
  res.json({ message: 'Password reset successful.' });
});

module.exports = router;