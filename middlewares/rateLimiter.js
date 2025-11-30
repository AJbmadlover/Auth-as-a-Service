// EMAIL VERIFY LIMITER
const rateLimit = require("express-rate-limit");

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // allow 3 tries per minute
  message: {
    message: "Too many verification attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// RESEND VERIFICATION EMAIL LIMITER

const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // allow resending once every 5 minutes
  message: {
    message: "You can only resend a verification email once every 5 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 2, // allow 2 password reset requests per day
  message: {
    message: "Too many password reset attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = {verifyLimiter,resendLimiter,resetPasswordLimiter};
