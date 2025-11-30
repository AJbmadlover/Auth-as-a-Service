const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieOptions = require("../utils/cookieOptions");
const { sendVerificationEmail, resendVerificationEmail, generateVerificationToken,generateResetPasswordToken, resetPasswordEmail,verifyPasswordResetToken } = require("../utils/emailTemplates");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken, 
} = require("../utils/jwt")
//blacklist used tokens for password reset to prevent reuse
const usedResetTokens = new Set();


// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const {email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password,12); //or 10 if it slows down the registeration 
    const user = await User.create({email, 
                                    password:hashedPassword,
                                    isVerified:false});
    // Generate verification token
    const token = generateVerificationToken(user);
    await sendVerificationEmail(email, token);                                
    res.status(201).json({ 
      message: "User registered successfully. Please verfiy email before login.", 
  });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
    console.log(error);
  }
};
// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token)
      return res.status(400).json({ message: "Invalid or missing token" });

    const payload = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user)
      return res.status(400).json({ message: "Token expired or invalid" });

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error verifying email" });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    await resendVerificationEmail(email, user);

    res.status(200).json({ message: "Verification email resent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resending verification email" });
  }
};

//GET RESET PASSWORD LINK
exports.getResetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset password token
    const token = generateResetPasswordToken(user);
    await resetPasswordEmail(email, token);
    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    res.status(500).json({ error: "Error sending password reset email" });
    console.log(error);
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
     const { token } = req.query;

    if (!token)
      return res.status(400).json({ message: "Invalid or missing token" });
     // Check if already used
    if (usedResetTokens.has(token)) {
      return res.status(400).json({ message: "Token already used" });
    }
    const payload = verifyPasswordResetToken(token);
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Token expired or invalid" });
    }
    const email = payload.email;  

    const {newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: "New password and confirm password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if(newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    // Hash the new password

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    // blacklist token so it can’t be reused
    usedResetTokens.add(token);
    //remove token from Set after a day
    setTimeout(() => {
      usedResetTokens.delete(token);
    }, 24 * 60 * 60 * 1000);

    //send success message 
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error resetting password" });
    console.log(error);
  }
};

//login as a user 
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body; 

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const payload = { id: user._id, email: user.email };
    const accessToken = signAccessToken(payload);  
    const refreshToken = signRefreshToken(payload);

res.cookie("accessToken", accessToken, cookieOptions);
res.cookie("refreshToken", refreshToken, cookieOptions);
res.status(200).json({message: "Logged in successfully",
  user:{
    id: user._id,
    email:user.email,
}, accessToken, refreshToken,}); //remove accessToken, refreshToken when doen with backend testing

  } catch (error) {
    res.status(500).json({ error: "Error logging in user" });
    console.log(error);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if user still exists
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }

    // Sign new access token
    const newAccessToken = signAccessToken({
      id: payload.id,
      email: payload.email,
    });

    // Set new access token cookie
    res.cookie("accessToken", newAccessToken, cookieOptions);

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};


//logout clear cookies
exports.logout = (req, res) => {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ message: "Logged out successfully" });
};   

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Assuming user ID is available in req.user

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password cannot be the same as the old password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error changing password" });
    console.log(error);
  }
};