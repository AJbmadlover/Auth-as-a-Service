// Load environment variables
const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const app = express();


//connect to mongoDb
connectDB();

// Middleware to parse JSON & COOKIE requests
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 6500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});