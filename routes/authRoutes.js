const {registerUser,loginUser,refreshToken,logout} = require("../controllers/authControllers");
const express = require("express");
const router = express.Router();

// Define auth routes here

router.post("/signup", registerUser);
router.post("/signin", loginUser);
router.get("/logout", logout);
router.post("/refresh", refreshToken);

module.exports = router;