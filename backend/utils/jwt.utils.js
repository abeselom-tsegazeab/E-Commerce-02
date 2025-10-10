import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate JWT token
 * @param {Object} payload - The payload to sign
 * @param {Object} options - Additional options
 * @returns {String} - JWT token
 */
export const generateToken = (payload, options = {}) => {
  const { expiresIn = JWT_EXPIRES_IN, secret = JWT_SECRET } = options;
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate refresh token
 * @param {Object} payload - The payload to sign
 * @returns {String} - Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN 
  });
};

/**
 * Verify JWT token
 * @param {String} token - The JWT token to verify
 * @param {String} secret - Optional secret to use for verification
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token, secret = JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Get token from request headers
 * @param {Object} req - Express request object
 * @returns {String} - JWT token or null
 */
export const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Generate token with user data
 * @param {Object} user - User object
 * @returns {Object} - Tokens and user data
 */
export const generateAuthTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken({ id: user._id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    }
  };
};
