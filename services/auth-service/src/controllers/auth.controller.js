const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const axios = require('axios');
const roleGuard = require('../middleware/roleGuard');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPViaMailService(email, otp, name) {
  await axios.post('http://mail-service:4003/mail/auth/verifyOTP', {
    email,
    otp,
    name,
  });
}

async function sendOTPResetPasswordMailService(email, otp, name) {
  await axios.post('http://mail-service:4003/mail/auth/resetPasswordOTP', {
    email,
    otp,
    name,
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
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          roleId: req.user.roleId,
        },
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
          } else {
            latitude = null;
            longitude = null;
          }
        } catch (err) {
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
    await sendOTPViaMailService(email, otp, name);
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
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            rolename: true,
          },
        },
      },
    });
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
      { id: user.id, email: user.email, name: user.name, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn }
    );
    res.json({
      data: {
        token: { expiresIn, accessToken: token },
        user: {
          roleName: user.role.rolename,
        },
      },
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
    await sendOTPViaMailService(email, otp, name);
    req.session.otp = otp;
    req.session.otpCreatedAt = Date.now();
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
  const handleDeleteSession = async () => {
    delete req.session.otp;
    delete req.session.otpCreatedAt;
    delete req.session.pendingUser;
  };
  if (
    req.session.otp === otp &&
    req.session.pendingUser &&
    req.session.pendingUser.email === email
  ) {
    const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
    const now = Date.now();
    const otpAge = now - req.session.otpCreatedAt;
    if (otpAge > OTP_EXPIRATION_TIME) {
      await handleDeleteSession();
      return res
        .status(400)
        .json({ message: 'OTP has expired. Please request a new one.' });
    }
    const { email, password, name } = req.session.pendingUser;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword, name, role_id: 1 },
    });
    await handleDeleteSession();
    res.json({ message: 'Registration successful!' });
  } else {
    res.status(400).json({ message: 'OTP is incorrect.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
          number_phone: user.number_phone,
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
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      data: null,
      message: 'Missing information.',
      errors: [],
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
    await sendOTPResetPasswordMailService(email, otp, user.name);
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
  const handleDeleteSession = async () => {
    delete req.session.resetOtp;
    delete req.session.resetEmail;
  };
  if (!email || !otp || !newPassword) {
    await handleDeleteSession();
    return res.status(400).json({
      data: null,
      message: 'Missing information.',
      errors: [],
    });
  }
  if (req.session.resetOtp !== otp || req.session.resetEmail !== email) {
    await handleDeleteSession();
    return res.status(400).json({
      data: null,
      message: 'OTP is incorrect or has expired.',
      errors: [],
    });
  }
  await handleDeleteSession();
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
  res.json({ message: 'Password reset successful.' });
};

exports.updateProfile = async (req, res) => {
  const {
    name,
    dateOfBirth,
    gender,
    avatar,
    addr_city,
    addr_district,
    addr_street,
    addr_detail,
    number_phone,
  } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        avatar,
        addr_city,
        addr_district,
        addr_street,
        addr_detail,
        number_phone,
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
          number_phone: user.number_phone,
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

exports.updateInternalProfile = async (req, res) => {
  const {
    id,
    name,
    dateOfBirth,
    gender,
    avatar,
    addr_city,
    addr_district,
    addr_street,
    addr_detail,
    number_phone,
  } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        avatar,
        addr_city,
        addr_district,
        addr_street,
        addr_detail,
        number_phone,
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
          number_phone: user.number_phone,
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
  const userId = req.user?.id || req.session?.userId;
  if (!userId) {
    return res.status(401).json({
      data: {
        authorized: false,
        userId: null,
        userRole: null,
        userEmail: null,
        userName: null,
      },
      message: 'Unauthorized',
      errors: ['No userId found in token or session'],
    });
  }
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
          userEmail: user.email,
          userName: user.name,
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
          userEmail: null,
          userName: null,
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

exports.sendConsignmentRequestToAgents = async (req, res) => {
  const { propertyInfo, customerInfo } = req.body;
  const agents = await prisma.user.findMany({
    where: { role: { rolename: 'Agent' } },
    select: { email: true },
  });
  const agentEmails = agents.map((a) => a.email);
  try {
    await axios.post(
      'http://mail-service:4003/mail/auth/sendConsignmentRequestToAgents',
      {
        propertyInfo,
        customerInfo,
        agentEmails,
      }
    );
    res.status(200).json({ message: 'Đã gửi email cho agent' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Gửi email cho agent thất bại', error: error.message });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({
        data: null,
        message: 'Invalid user id.',
        errors: ['Invalid user id.'],
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          number_phone: user.number_phone,
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

exports.getPublicAgent = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role_id: {
          in: [2, 4],
        },
      },
    });
    if (!user)
      return res.status(404).json({
        data: null,
        message: 'User not found.',
        errors: [],
      });
    res.json({
      data: {
        user: user,
      },
      message: 'Agent fetched successfully.',
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

exports.getPublicJouralist = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role_id: 3,
      },
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
        user: user,
      },
      message: 'Agent fetched successfully.',
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

exports.getPublicCustomer = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role_id: 1,
      },
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
          number_phone: user.number_phone,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      message: 'Agent fetched successfully.',
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
exports.getPublicListAgent = async (req, res) => {
  try {
    const { page, limit, search, onlyAgent } = req.query;
    let where = {};

    if (onlyAgent && onlyAgent === 'true') {
      where = {
        role_id: { in: [2] },
      };
    } else {
      where = {
        role_id: { in: [2, 4] },
      };
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { number_phone: { contains: search } },
      ];
    }

    const select = {
      id: true,
      email: true,
      name: true,
      role_id: true,
      avatar: true,
      latitude: true,
      longitude: true,
      dateOfBirth: true,
      gender: true,
      addr_city: true,
      addr_district: true,
      addr_street: true,
      addr_detail: true,
      number_phone: true,
      created_at: true,
      updated_at: true,
    };

    let agents, total;

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      [agents, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select,
          skip,
          take: limitNum,
          orderBy: { created_at: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);
    } else {
      [agents, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select,
          orderBy: { created_at: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);
    }

    if (!agents || agents.length === 0) {
      return res.status(404).json({
        data: null,
        message: 'User not found.',
        errors: [],
      });
    }

    return res.json({
      data: {
        total,
        agents,
      },
      message: 'Agent fetched successfully.',
      errors: [],
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      message: 'Internal server error.',
      errors: [error.message],
    });
  }
};

exports.getPublicListJournalist = async (req, res) => {
  const agents = await prisma.user.findMany({
    where: {
      role_id: 3,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role_id: true,
      avatar: true,
      latitude: true,
      longitude: true,
      dateOfBirth: true,
      gender: true,
      addr_city: true,
      addr_district: true,
      addr_street: true,
      addr_detail: true,
      number_phone: true,
      created_at: true,
      updated_at: true,
    },
  });
  if (agents.lenght == 0) {
    return res.status(404).json({
      data: null,
      message: 'User not found.',
      errors: [],
    });
  }
  res.json({
    data: {
      agents: agents,
    },
    message: 'Agent fetched successfully.',
    errors: [],
  });
};

exports.getPublicListProperty = async (req, res) => {
  let { userIds, search } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({
      data: null,
      message: 'userIds must be an array',
      errors: [],
    });
  }
  userIds = userIds.map((id) => Number(id));
  let where = {
    id: {
      in: userIds,
    },
  };
  if (search) {
    where = {
      ...where,
      name: {
        contains: search,
      },
    };
  }
  const user = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      addr_city: true,
      addr_district: true,
      addr_street: true,
      addr_detail: true,
      number_phone: true,
    },
  });
  if (user.lenght == 0) {
    return res.status(404).json({
      data: null,
      message: 'User not found.',
      errors: [],
    });
  }
  res.json({
    data: user,
    message: 'User fetched successfully.',
    errors: [],
  });
};

exports.getTotalCustomer = async (req, res) => {
  try {
    const totalCustomer = await prisma.user.count({
      where: {
        role_id: roleGuard.RoleName.Customer,
      },
    });
    const totalStaff = await prisma.user.count({
      where: {
        role_id: roleGuard.RoleName.Agent,
      },
    });
    res.json({
      data: {
        total_customer: totalCustomer,
        total_staff: totalStaff,
      },
      message: 'User fetched successfully.',
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error fetching total customers.',
      errors: [error.message],
    });
  }
};

exports.getMonthlyNewCustomers = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11); // 12 tháng tính cả hiện tại
    startDate.setDate(1); // đầu tháng

    // Lấy toàn bộ customer trong khoảng thời gian này
    const customers = await prisma.user.findMany({
      where: {
        role_id: roleGuard.RoleName.Customer,
        created_at: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        created_at: true,
      },
    });

    // Khởi tạo mảng 12 tháng
    const monthlyStats = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      monthlyStats.push({
        month: `${month}/${year}`,
        customer_count: 0,
      });
    }

    // Đếm số lượng theo tháng
    customers.forEach((c) => {
      const month = String(c.created_at.getMonth() + 1).padStart(2, '0');
      const year = c.created_at.getFullYear();
      const monthLabel = `${month}/${year}`;

      const stat = monthlyStats.find((m) => m.month === monthLabel);
      if (stat) {
        stat.customer_count += 1;
      }
    });

    res.json({
      data: monthlyStats,
      message: 'Monthly customer stats fetched successfully.',
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error fetching monthly customer stats.',
      errors: [error.message],
    });
  }
};

// Lấy danh sách người dùng
exports.getListUsers = async (req, res) => {
  try {
    const { page, limit, search, roleId } = req.query;

    let where = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { number_phone: { contains: search } },
      ];
    }
    if (roleId) {
      where.role_id = Number(roleId);
    }

    const select = {
      id: true,
      email: true,
      name: true,
      role_id: true,
      avatar: true,
      latitude: true,
      longitude: true,
      dateOfBirth: true,
      gender: true,
      addr_city: true,
      addr_district: true,
      addr_street: true,
      addr_detail: true,
      number_phone: true,
      created_at: true,
      updated_at: true,
      role: {
        select: {
          rolename: true,
        },
      },
    };

    let users, total;
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select,
          skip,
          take: limitNum,
          orderBy: { created_at: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);
    } else {
      [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select,
          orderBy: { created_at: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);
    }

    if (!users || users.length === 0) {
      return res.status(404).json({
        data: null,
        message: 'No users found.',
        errors: [],
      });
    }

    res.json({
      data: {
        total,
        users,
        pagination: {
          total: search ? users.length : total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil((search ? users.length : total) / limit),
        },
      },
      message: 'Users fetched successfully.',
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error fetching users.',
      errors: [error.message],
    });
  }
};

// Lấy chi tiết người dùng theo ID
exports.getDetailUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({
        data: null,
        message: 'Invalid user ID.',
        errors: ['Invalid user ID.'],
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            rolename: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        message: 'User not found.',
        errors: [],
      });
    }

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          avatar: user.avatar,
          role: user.role,
          addr_city: user.addr_city,
          addr_district: user.addr_district,
          addr_street: user.addr_street,
          addr_detail: user.addr_detail,
          number_phone: user.number_phone,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        pagination: {
          total: 1,
          page: 1,
          limit: 1,
          totalPages: 1,
        },
      },
      message: 'User details fetched successfully.',
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
