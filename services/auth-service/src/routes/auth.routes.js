const express = require('express');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

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
  // Kiểm tra độ mạnh mật khẩu
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) { // score từ 0-4, nên yêu cầu >= 3
    return res.status(400).json({ message: 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt, tối thiểu 8 ký tự).' });
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
    // Xóa trạng thái xác thực OTP sau khi đăng ký thành công
    delete req.session.otpVerified;
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    // Đăng nhập thành công, có thể lưu session hoặc trả về thông tin user
    req.session.userId = user.id;
    res.json({ message: 'Đăng nhập thành công', user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (req.session.otp === otp && req.session.otpEmail === email) {
    // Đánh dấu đã xác thực OTP
    req.session.otpVerified = true;
    // Xóa OTP khỏi session
    delete req.session.otp;
    delete req.session.otpEmail;
    res.json({ message: 'Xác thực OTP thành công!' });
  } else {
    res.status(400).json({ message: 'OTP không đúng hoặc đã hết hạn.' });
  }
});
router.post('/register', async (req, res) => {
  // Kiểm tra đã xác thực OTP chưa
  if (!req.session.otpVerified) {
    return res.status(400).json({ message: 'Bạn cần xác thực OTP trước khi đăng ký.' });
  }
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
  }
  // Kiểm tra độ mạnh mật khẩu
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) { // score từ 0-4, nên yêu cầu >= 3
    return res.status(400).json({ message: 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt, tối thiểu 8 ký tự).' });
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
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Thiếu email' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.otpEmail = email;
    console.log(`OTP ${otp} đã gửi tới ${email}`); // Thêm log này để kiểm tra
    res.status(200).json({ message: 'Đã gửi mã OTP đến email. Vui lòng xác thực.' });
  } catch (err) {
    console.error('Lỗi gửi OTP:', err);
    res.status(500).json({ message: 'Lỗi gửi email', error: err.message });
  }
});
// Lấy thông tin user hiện tại
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
module.exports = router;

// Hàm gửi OTP
async function sendOTP(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // hoặc SMTP provider khác
    auth: {
      user: 'realestate14052025@gmail.com', // thay bằng email của bạn
      pass: 'lbjv ijzq wfzy jhxk' // dùng app password nếu dùng Gmail
    }
  });
  await transporter.sendMail({
    from: 'realestate14052025@gmail.com',
    to: email,
    subject: 'Mã xác thực OTP',
    text: `Mã OTP của bạn là: ${otp}`
  });
}
// Đổi mật khẩu
router.post('/change-password', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập.' });
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin.' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'Mật khẩu mới quá yếu.' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  res.json({ message: 'Đổi mật khẩu thành công.' });
});

// Quên mật khẩu - gửi OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Thiếu email.' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Email không tồn tại.' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTP(email, otp);
    req.session.resetOtp = otp;
    req.session.resetEmail = email;
    res.json({ message: 'Đã gửi mã OTP đặt lại mật khẩu.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi OTP.', error: err.message });
  }
});

// Đặt lại mật khẩu bằng OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin.' });
  }
  if (req.session.resetOtp !== otp || req.session.resetEmail !== email) {
    return res.status(400).json({ message: 'OTP không đúng hoặc đã hết hạn.' });
  }
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'Mật khẩu mới quá yếu.' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  delete req.session.resetOtp;
  delete req.session.resetEmail;
  res.json({ message: 'Đặt lại mật khẩu thành công.' });
});
