const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    // Remove sensitive fields
    delete logBody.password;
    delete logBody.token;
    console.log(`[${timestamp}] Request body:`, logBody);
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log errors
    if (res.statusCode >= 400) {
      console.error(`[${timestamp}] Error response:`, data);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    user: req.user?.id || 'anonymous'
  });
  
  next(err);
};

module.exports = { requestLogger, errorLogger };