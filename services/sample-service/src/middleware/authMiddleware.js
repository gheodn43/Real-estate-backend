import axios from 'axios';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      data: null,
      message: '',
      error: ['No token provided'],
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const response = await axios.get('http://auth-service:4001/auth/verify', {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.data.authorized) {
      req.user = {
        userId: response.data.userId,
        userRole: response.data.role,
      };
      next();
    } else {
      return res.status(403).json({
        data: null,
        message: '',
        error: ['Unauthorized'],
      });
    }
  } catch (error) {
    return res.status(500).json({
      data: null,
      message: '',
      error: ['Failed to verify token'],
    });
  }
};

export default authMiddleware;
