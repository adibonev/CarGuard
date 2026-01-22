const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Accept both x-auth-token and Authorization header formats
  let token = req.header('x-auth-token');
  
  if (!token) {
    token = req.header('Authorization')?.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
