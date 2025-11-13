import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate a JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Adjust as needed
  });
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    console.log('Authenticated user:', user.role, user._id);

    next();
  } catch (error) {
    console.log('Auth error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};