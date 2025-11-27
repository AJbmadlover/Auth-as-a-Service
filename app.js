const express = require('express');

const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

// Load environment variables
dotenv.config();
//connect to mongoDb
connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 6500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});