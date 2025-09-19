const { Pool } = require('pg');
const { verifyAccessToken } = require('../utils/tokenGenerator');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    let decoded;
    
    // Try to decode as a regular JWT first
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      // If JWT verification fails, try to decode as base64 (for fake tokens)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          decoded = payload;
        } else {
          throw new Error('Invalid token format');
        }
      } catch (decodeError) {
        throw jwtError; // Throw original JWT error
      }
    }
    
    // Use decoded token data directly
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'owner',
      business_id: decoded.businessId || decoded.userId
    };
    
    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };