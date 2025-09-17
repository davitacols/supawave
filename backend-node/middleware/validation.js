const validateProduct = (req, res, next) => {
  const { name, price, quantity } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  
  if (!price || price <= 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  
  next();
};

const validateSale = (req, res, next) => {
  const { items, customer_name } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sale items are required' });
  }
  
  for (const item of items) {
    if ((!item.product_id && !item.product) || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: 'Invalid item in sale' });
    }
  }
  
  next();
};

const validateStaff = (req, res, next) => {
  const { username, email, first_name, last_name, role } = req.body;
  
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First and last name are required' });
  }
  
  if (!['manager', 'cashier'].includes(role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }
  
  next();
};

module.exports = { validateProduct, validateSale, validateStaff };