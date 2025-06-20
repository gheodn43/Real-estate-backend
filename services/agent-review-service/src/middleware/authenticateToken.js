import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({
      data: null,
      message: 'No token provided.',
      errors: [],
    });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({
        data: null,
        message: 'Invalid token.',
        errors: [],
      });
    req.user = user;
    next();
  });
}

function authorizeAgent(req, res, next) {
  if (!req.user.roleId || req.user.roleId !== 2) {
    // Giả định roleId = 2 là 'agent'
    return res.status(403).json({
      data: null,
      message: 'Not authorized as agent.',
      errors: [],
    });
  }
  next();
}

function authorizeAdmin(req, res, next) {
  if (!req.user.roleId || req.user.roleId !== 4) {
    // Giả định roleId = 3 là 'admin'
    return res.status(403).json({
      data: null,
      message: 'Not authorized as admin.',
      errors: [],
    });
  }
  next();
}

export { authenticateToken, authorizeAgent, authorizeAdmin };
