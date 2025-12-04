const jwt = require('jsonwebtoken');
const User = require('../models/user');


exports.protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let decoded;
    let user;

    // -----------------------------
    // 1️⃣ Try access token first
    // -----------------------------
    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
      } catch (err) {
        if (err.name !== 'TokenExpiredError') {
          return res.status(401).json({ message: 'Access token invalid' });
        }
        // Expired, will try refresh token
      }
    }

    // -----------------------------
    // 2️⃣ Check refresh token if access token expired or missing
    // -----------------------------
    if (!decoded && refreshToken) {
      try {
        const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        user = await User.findById(refreshDecoded.id);
        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        // Issue new access token
        const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESS_SECRET, {
          expiresIn: '15m',
        });

        // Set new cookie
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        decoded = { id: user._id }; // proceed with this user
      } catch (refreshErr) {
        return res.status(401).json({ message: 'Refresh token invalid or expired' });
      }
    }

    // -----------------------------
    // 3️⃣ Get user if not already fetched
    // -----------------------------
    if (!user) {
      user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'User no longer exists' });
    }

    // -----------------------------
    // 4️⃣ Check password changed
    // -----------------------------
    if (user.passwordChangedAt) {
      const passwordChangedTime = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedTime) {
        return res.status(401).json({ message: 'Password changed. Please log in again.' });
      }
    }

    req.user = user;

    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
