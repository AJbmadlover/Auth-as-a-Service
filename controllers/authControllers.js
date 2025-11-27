const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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