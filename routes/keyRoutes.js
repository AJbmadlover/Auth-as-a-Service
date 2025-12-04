const {generateApiKey, getApiKey, toggleApiKey, getApiKeys, deleteApiKey} = require("../controllers/keyControllers");

const {validateApiKey} = require("../middlewares/apiKey");
const {adminOnly} = require("../middlewares/adminMiddleware");
const {protect} = require("../middlewares/authenticate");


const express = require("express");
const router = express.Router();

// Route to generate a new API key
router.post("/generate", protect, generateApiKey);

//Route to get user API keys
router.get("/", protect, validateApiKey,  getApiKey);

// Route to toggle API key active state
router.post("/toggle", protect, toggleApiKey);

// Route to get all API keys for a user (Admin only)
router.get("/all", protect, adminOnly(), getApiKeys);

// Route to delete an API key
router.delete("/delete", protect, adminOnly(), deleteApiKey);

module.exports = router;