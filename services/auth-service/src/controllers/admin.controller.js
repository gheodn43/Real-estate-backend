const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

function generateRandomPassword(length = 10) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendPasswordViaMailService(email, password, name, roleName) {
  await axios.post('http://mail-service:4003/mail/auth/sendPassword', {
    email,
    password,
    name,
    roleName,
  });
}

exports.createUserByAdmin = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in.' });
  }
  const admin = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  if (
    !admin ||
    (admin.role && admin.role.rolename !== 'Admin' && admin.role_id !== 4)
  ) {
    return res
      .status(403)
      .json({ message: 'Permission denied. Only Admin can create users.' });
  }
  const { email, password, name, roleName } = req.body;
  if (!email || !name || !roleName) {
    return res.status(400).json({ message: 'Missing information.' });
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists.' });
  }
  const role = await prisma.userRole.findUnique({
    where: { rolename: roleName },
  });
  if (!role) {
    return res.status(400).json({ message: 'Role does not exist.' });
  }
  let finalPassword = password;
  if (!finalPassword) {
    finalPassword = generateRandomPassword();
  }
  const hashedPassword = await bcrypt.hash(finalPassword, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role_id: role.id,
    },
  });
  if (!password) {
    try {
      await sendPasswordViaMailService(email, finalPassword, name, roleName);
    } catch (err) {
      return res.status(500).json({
        message: 'User created, but failed to send password email.',
        error: err.message,
      });
    }
  }
  res.json({ message: 'User created successfully.', user });
};
