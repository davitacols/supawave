const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API is running',
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'pic2nav@gmail.com' && password === 'password123') {
    res.json({
      user: {
        id: '1104518454268002305',
        email: 'pic2nav@gmail.com',
        first_name: 'Camp',
        last_name: 'Davids',
        role: 'owner',
        business_id: '1104518460022685697'
      },
      tokens: {
        access: 'test-token',
        refresh: 'test-refresh-token',
        expiresIn: 86400
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Export for Vercel
module.exports = app;