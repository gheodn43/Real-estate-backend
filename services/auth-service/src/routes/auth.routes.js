const express = require('express');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    res.json({
      message: 'Logged in with Google',
      user: req.user
    });
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

// Route đăng ký
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
  }
  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.googleId) {
        // Đã đăng nhập bằng Google
        return res.status(400).json({ message: 'Email này đã được đăng nhập bằng Google, không thể đăng ký bằng email này.' });
      } else {
        // Đã đăng ký bằng email/password
        return res.status(400).json({ message: 'Email này đã được đăng ký.' });
      }
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Tạo user mới
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role_id: 1 
      }
    });
    res.status(201).json({ message: 'Đăng ký thành công', user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
module.exports = router;
