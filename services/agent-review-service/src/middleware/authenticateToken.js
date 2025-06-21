import axios from 'axios';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      data: null,
      message: 'No token provided.',
      errors: [],
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const response = await axios.get('http://auth-service:4001/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = response.data?.data?.user;
    if (!user) {
      return res.status(403).json({
        data: null,
        message: 'Invalid token.',
        errors: [],
      });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(403).json({
      data: null,
      message: 'Invalid token.',
      errors: [],
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.id !== 'admin') {
    return res.status(403).json({
      data: null,
      message: 'Access denied. Admins only.',
      errors: [],
    });
  }
  next();
};

export const authorizeAgent = (req, res, next) => {
  if (!req.user || req.user.role?.id !== 'agent') {
    return res.status(403).json({
      data: null,
      message: 'Access denied. Agents only.',
      errors: [],
    });
  }
  next();
};

export default authenticateToken;
