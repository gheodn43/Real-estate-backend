const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const axios = require('axios');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'realestate14052025@gmail.com',
      pass: 'lbjv ijzq wfzy jhxk',
    },
  });
  await transporter.sendMail({
    from: 'realestate14052025@gmail.com',
    to: email,
    subject: 'OTP Verification Code',
    text: `Your OTP code is: ${otp}`,
  });
}

exports.googleLogin = (req, res, next) => {
  require('passport').authenticate('google', { scope: ['profile', 'email'] })(
    req,
    res,
    next
  );
};

exports.googleCallback = [
  require('passport').authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  async (req, res) => {
    try {
      const expiresIn = 3600;
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name },
        JWT_SECRET,
        { expiresIn }
      );

      let latitude, longitude;
      const clientIp =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      if (clientIp === '127.0.0.1' || clientIp === '::1') {
        latitude = null;
        longitude = null;
      } else {
        try {
          const response = await axios.get(
            `http://ip-api.com/json/${clientIp}`,
            {
              timeout: 5000,
            }
          );

          if (response.data.status === 'success') {
            latitude = response.data.lat;
            longitude = response.data.lon;
            console.log(`IP-based location: lat=${latitude}, lng=${longitude}`);
          } else {
            console.warn(
              `IP geolocation failed: ${response.data.reason || 'Unknown error'}`
            );
            latitude = null;
            longitude = null;
          }
        } catch (err) {
          console.error(`Error fetching IP location: ${err.message}`);
          latitude = null;
          longitude = null;
        }
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        },
      });

      res.json({
        data: {
          token: { expiresIn, accessToken: token },
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            googleId: user.googleId,
            latitude: user.latitude,
            longitude: user.longitude,
            created_at: user.created_at,
          },
        },
        message: 'Successfully',
        errors: [],
      });
    } catch (err) {
      console.error(`Google callback error: ${err.message}`);
      res.status(500).json({
        data: null,
        message: 'Server error',
        errors: [err.message],
      });
    }
  },
];

exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.sendStatus(500);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
};

exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      data: null,
      message: 'Missing registration information.',
      errors: [],
    });
  }
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({
      data: null,
      message: 'Password is too weak. Please choose a stronger password.',
      errors: [],
    });
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      data: null,
      message: 'Email is already registered.',
      errors: [],
    });
  }
  const otp = generateOTP();
  try {
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.pendingUser = { email, password, name };
    res.status(200).json({
      data: null,
      message: 'OTP has been sent to your email. Please verify.',
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Failed to send OTP.',
      errors: [err.message],
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (
    req.session.otp === otp &&
    req.session.pendingUser &&
    req.session.pendingUser.email === email
  ) {
    const { email, password, name } = req.session.pendingUser;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword, name, role_id: 1 },
    });
    delete req.session.otp;
    delete req.session.pendingUser;
    res.json({
      data: null,
      message: 'Đăng ký thành công!',
      errors: [],
    });
  } else {
    res.status(400).json({
      data: null,
      message: 'OTP không đúng hoặc đã hết hạn.',
      errors: [],
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: 'Missing email or password',
      errors: ['Missing email or password'],
    });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(400).json({
        data: null,
        message: 'Incorrect email or password',
        errors: ['Incorrect email or password'],
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        data: null,
        message: 'Incorrect email or password',
        errors: ['Incorrect email or password'],
      });
    }
    req.session.userId = user.id;
    const expiresIn = 604800;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn }
    );
    res.json({
      data: { token: { expiresIn, accessToken: token } },
      message: 'Successfully',
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      errors: [err.message],
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (req.session.otp === otp && req.session.otpEmail === email) {
    req.session.otpVerified = true;
    delete req.session.otp;
    delete req.session.otpEmail;
    res.json({
      data: null,
      message: 'OTP verification successful!',
      errors: [],
    });
  } else {
    res.status(400).json({
      data: null,
      message: 'OTP is incorrect or has expired.',
      errors: [],
    });
  }
};

exports.sendOtp = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: 'Missing registration information.' });
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'Email is already registered.' });
  }
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ message: 'Password is too weak.' });
  }
  const otp = generateOTP();
  try {
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.pendingUser = { email, password, name };
    res
      .status(200)
      .json({ message: 'OTP has been sent to your email. Please verify.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP email.' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (
    req.session.otp === otp &&
    req.session.pendingUser &&
    req.session.pendingUser.email === email
  ) {
    const { email, password, name } = req.session.pendingUser;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword, name, role_id: 1 },
    });
    delete req.session.otp;
    delete req.session.pendingUser;
    res.json({ message: 'Registration successful!' });
  } else {
    res.status(400).json({ message: 'OTP is incorrect or has expired.' });
  }
};

exports.getProfile = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      data: null,
      message: 'Not logged in',
      errors: [],
    });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { role: true },
    });
    if (!user)
      return res.status(404).json({
        data: null,
        message: 'User not found.',
        errors: [],
      });
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          dayOfBirth: user.dateOfBirth,
          gender: user.gender,
          avatar: user.avatar,
          role: user.role,
          addr_city: user.addr_city,
          addr_district: user.addr_district,
          addr_street: user.addr_street,
          addr_detail: user.addr_detail,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      message: 'Profile fetched successfully.',
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      errors: [err.message],
    });
  }
};

exports.getProfileToken = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      error: err.message,
      errors: [],
    });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    let { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      const clientIp =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      if (clientIp === '127.0.0.1' || clientIp === '::1') {
        return res.status(400).json({
          data: null,
          message:
            'Cannot determine location from localhost IP. Please provide coordinates.',
          errors: ['Localhost IP detected'],
        });
      }

      try {
        const response = await axios.get(`http://ip-api.com/json/${clientIp}`, {
          timeout: 5000,
        });

        if (response.data.status === 'success') {
          latitude = response.data.lat;
          longitude = response.data.lon;
        } else {
          return res.status(400).json({
            data: null,
            message: 'Unable to determine location from IP.',
            errors: [response.data.reason || 'IP geolocation failed'],
          });
        }
      } catch (err) {
        return res.status(400).json({
          data: null,
          message: 'Failed to get location from IP.',
          errors: [err.message],
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    res.json({
      message: 'Location updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      error: err.message,
      errors: [],
    });
  }
};

exports.changePassword = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      data: null,
      message: 'You need to login.',
      errors: [],
    });
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      data: null,
      message: 'Missing information.',
      errors: [],
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
  });
  if (!user)
    return res.status(404).json({
      data: null,
      message: 'User not found.',
      errors: [],
    });
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch)
    return res.status(400).json({
      data: null,
      message: 'Old password is incorrect.',
      errors: [],
    });
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({
      data: null,
      message: 'New password is too weak.',
      errors: [],
    });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
  res.json({
    data: null,
    message: 'Password changed successfully.',
    errors: [],
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({
      data: null,
      message: 'Missing email.',
      errors: [],
    });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(400).json({
      data: null,
      message: 'Email does not exist.',
      errors: [],
    });
  const otp = generateOTP();
  try {
    await sendOTP(email, otp);
    req.session.resetOtp = otp;
    req.session.resetEmail = email;
    res.json({
      data: null,
      message: 'OTP for password reset has been sent.',
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Send OTP error.',
      error: err.message,
      errors: [],
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      data: null,
      message: 'Missing information.',
      errors: [],
    });
  }
  if (req.session.resetOtp !== otp || req.session.resetEmail !== email) {
    return res.status(400).json({
      data: null,
      message: 'OTP is incorrect or has expired.',
      errors: [],
    });
  }
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({
      data: null,
      message: 'New password is too weak.',
      errors: [],
    });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  delete req.session.resetOtp;
  delete req.session.resetEmail;
  res.json({ message: 'Password reset successful.' });
};

exports.updateProfile = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      data: null,
      message: 'Not logged in',
      errors: [],
    });
  }
  const {
    dateOfBirth,
    gender,
    avatar,
    addr_city,
    addr_district,
    addr_street,
    addr_detail,
  } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        avatar,
        addr_city,
        addr_district,
        addr_street,
        addr_detail,
      },
    });
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          avatar: user.avatar,
          addr_city: user.addr_city,
          addr_district: user.addr_district,
          addr_street: user.addr_street,
          addr_detail: user.addr_detail,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      message: 'Profile updated successfully.',
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      errors: [err.message],
    });
  }
};

exports.checkUserExists = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (user) {
      res.json({
        data: {
          authorized: true,
          userId: user.id,
          userRole: user.role_id,
        },
        message: 'User exists',
        errors: [],
      });
    } else {
      res.json({
        data: {
          authorized: false,
          userId: null,
          userRole: null,
        },
        message: 'User does not exist',
        errors: [],
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      message: 'Server error',
      errors: [err.message],
    });
  }
};
