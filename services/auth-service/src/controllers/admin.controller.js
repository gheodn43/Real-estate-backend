const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createUserByAdmin = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
        message: 'Not logged in.' 
    });
  }
  const admin = await prisma.User.findUnique({ 
    where: { id: req.session.userId }, 
    include: { role: true } 
  });
  if (!admin || (admin.role && admin.role.rolename !== 'Admin' && admin.role_id !== 4)) {
    return res.status(403).json({ 
        message: 'Permission denied. Only Admin can create users.' 
    });
  }

  const { email, password, name, roleName } = req.body; 
  if (!email || !password || !name || !roleName) {
    return res.status(400).json({ 
        message: 'Missing information.' 
    });
  }
  const existingUser = await prisma.User.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ 
        message: 'Email already exists.' 
    });
  }
  const role = await prisma.UserRole.findUnique({ where: { rolename: roleName } });
  if (!role) {
    return res.status(400).json({ message: 'Role does not exist.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.User.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role_id: role.id
    }
  });
  res.json({ message: 'User created successfully.', user });
};

