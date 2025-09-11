const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    businessId: user.business_id
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
    issuer: 'supawave-api',
    audience: 'supawave-client'
  });
};

// Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    tokenId: crypto.randomUUID()
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
    issuer: 'supawave-api',
    audience: 'supawave-client'
  });
};

// Generate both tokens
const generateTokenPair = (user) => {
  return {
    access: generateAccessToken(user),
    refresh: generateRefreshToken(user),
    expiresIn: 900 // 15 minutes in seconds
  };
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'supawave-api',
      audience: 'supawave-client'
    });
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'supawave-api',
      audience: 'supawave-client'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken
};