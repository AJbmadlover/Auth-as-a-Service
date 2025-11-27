const {registerUser,} = require("../controllers/authControllers");
const express = require("express");
const router = express.Router();

// Define auth routes here

router.post("/signup", registerUser);

module.exports = router;