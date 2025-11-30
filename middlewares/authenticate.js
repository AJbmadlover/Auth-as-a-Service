const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
  try {
    //Get token from headers
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    //Check if password has been changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedTime = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedTime) {
        return res.status(401).json({ message: 'Password was changed. Please log in again.' });
      }
    }

    //Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
