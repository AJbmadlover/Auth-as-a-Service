const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieOptions = require("../utils/cookieOptions");


const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken, 
} = require("../utils/jwt")

const generateToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn:"15m",
    })
} 
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
    const user = await User.create({email, password:hashedPassword});
    const token = generateToken(user._id);
    res.status(201).json({ 
      message: "User registered successfully",
      user:{
        id: user._id,
        email:user.email, 
      },
      token,  
  });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
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