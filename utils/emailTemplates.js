const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const jwt = require("jsonwebtoken");

// Generate verification JWT
exports.generateVerificationToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "1h" } // 1 hour
  );
};

// Generate reset password JWT
exports.generateResetPasswordToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.EMAIL_RESET_SECRET,
    { expiresIn: "1h" } // 1 hour
  );
};
// Verify RESET JWT
exports.verifyPasswordResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.EMAIL_RESET_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

// Verify EMAIL VERIFICATION JWT
exports.verifyEmailToken = (token) => {
  try {
    return jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

exports.sendVerificationEmail = async (to, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}" 
           style="display:inline-block;
                  padding:10px 20px;
                  background:#4CAF50;
                  color:white;
                  text-decoration:none;
                  border-radius:6px;">
           Verify Email
        </a>

        <p>If the button doesn't work, use this link:</p>
        <p>${verificationLink}</p>
      `,
    });

    console.log("Verification email sent to", to);
  } catch (err) {
    console.error("Resend Email Error:", err);
    throw new Error("Could not send verification email");
  }
};

// Resend verification email
exports.resendVerificationEmail = async (to, user) => {
  const token = exports.generateVerificationToken(user);
  await exports.sendVerificationEmail(to, token);
  return token;
};

exports.resetPasswordEmail = async (to, token) => {
  const resetLink = `${process.env.CLIENT_URL}/api/auth/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" 
           style="display:inline-block;
                  padding:10px 20px;
                  background:#f44336;
                  color:white;
                  text-decoration:none;
                  border-radius:6px;">
           Reset Password
        </a>

        <p>If the button doesn't work, use this link:</p>
        <p>${resetLink}</p>
      `,
    });

    console.log("Password reset email sent to", to);
  } catch (err) {
    console.error("Resend Email Error:", err);
    throw new Error("Could not send password reset email");
  }
};

