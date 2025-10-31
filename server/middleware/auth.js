import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Token is not valid'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated'
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: 'Token is not valid'
    });
  }
};

export default auth;
