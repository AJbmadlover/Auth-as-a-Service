const express = require("express");
const router = express.Router();
const { registerUser, loginUser, refreshToken, logout, verifyEmail, resendVerification } = require("../controllers/authControllers");
const { verifyLimiter, resendLimiter } = require("../middlewares/rateLimiter");

router.post("/signup", registerUser);
router.post("/signin", loginUser);
router.get("/logout", logout);
router.post("/refresh", refreshToken);

router.get("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);

module.exports = router;
