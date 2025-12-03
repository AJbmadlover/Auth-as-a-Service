const crypto = require('crypto');
const ApiKey = require('../models/apiKey');
const redis = require('../config/redis');
const bcrypt = require('bcrypt');
// Generate a new API key
exports.generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate plain API key
    const apiKeyValue = crypto.randomBytes(32).toString('hex');

    // Hash the key for DB storage
    const hashedApiKey = await bcrypt.hash(apiKeyValue, 10);

    // Save hashed key in MongoDB
    const newApiKey = new ApiKey({
      key: hashedApiKey,
      user: userId,
    });
    await newApiKey.save();

    //  Store plain key in Redis for quick lookup
    await redis.set(apiKeyValue, userId.toString());

    //  Send plain key to user
    res.status(201).json({ apiKey: apiKeyValue });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.toggleApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.body;
    const apiKey = await ApiKey.findById(apiKeyId);

    if (!apiKey) return res.status(404).json({ message: 'API key not found' });

    // Toggle active state
    apiKey.active = !apiKey.active;
    await apiKey.save();

    res.status(200).json({ message: `API key is now ${apiKey.active ? 'active' : 'inactive'}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all API keys for a user
exports.getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await ApiKey.find({ user: userId });

    res.status(200).json({ apiKeys });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Delete an API key ADMIN ONLY
exports.deleteApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.body;
    const apiKey = await ApiKey.findById(apiKeyId);

    if (!apiKey) return res.status(404).json({ message: 'API key not found' });

    await ApiKey.findByIdAndDelete(apiKeyId);

    res.status(200).json({ message: 'API key deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};