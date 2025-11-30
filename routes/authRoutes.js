const express = require("express");
const router = express.Router();
const { registerUser, loginUser, refreshToken, 
        logout, verifyEmail, resendVerification,
        getResetPasswordLink,resetPassword,changePassword } = require("../controllers/authControllers");
const { verifyLimiter, resendLimiter,resetPasswordLimiter } = require("../middlewares/rateLimiter");
const { protect } = require('../middlewares/authenticate');


router.post("/signup", registerUser);
router.post("/signin", loginUser);
router.get("/logout", logout);
router.post("/refresh", refreshToken);

router.get("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);

router.get("/forgot-password",resetPasswordLimiter, getResetPasswordLink); 
router.post("/reset-password", resetPassword);

router.get("/change-password", protect, changePassword);//only user who is logged in can change password

module.exports = router;
