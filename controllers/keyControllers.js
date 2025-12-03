const crypto = require('crypto');
const User = require('../models/user')
const ApiKey = require('../models/apiKey');
const redis = require('../config/redis');
const bcrypt = require('bcrypt');
// Generate a new API key
exports.generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingKeys = await ApiKey.countDocuments({ user: userId });
    if (existingKeys >= 3) {
        return res.status(400).json({ message: "Maximum number of API keys reached" });
    }

    // Generate plain API key
    const apiKeyValue = crypto.randomBytes(32).toString('hex');

    // Hash the key for DB storage
    const hashedApiKey = await bcrypt.hash(apiKeyValue, 10);

    // Save hashed key in MongoDB
    const newApiKey = new ApiKey({
      key: hashedApiKey,
      rawKey: apiKeyValue,
      user: userId,
    });
    await newApiKey.save();

    //  Store plain key in Redis for quick lookup
    await redis.set(`apiKey:${apiKeyValue}`, userId.toString(), {
      EX:86400 // Set expiration time for a day 
    });

    //  Send plain key to user
    res.status(201).json({ apiKey: apiKeyValue });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//get API key for user 
exports.getApiKey = async (req, res) => {
  try {
    const userId = req.user.id;

    const apiKeys = await ApiKey.find({ user: userId });

    res.status(200).json({ apiKeys });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.toggleApiKey = async (req, res) => {
  try {
    const {apiKeyId} = req.body;
    const userId = req.user.id;
    const apiKey = await ApiKey.findById(apiKeyId);

    if (!apiKey) return res.status(404).json({ message: 'API key not found' });
    if (apiKey.user.toString() !== userId)
      return res.status(403).json({ message: 'Unauthorized' });

    // Toggle active state
    apiKey.active = !apiKey.active;
    await apiKey.save();

    res.status(200).json({ message: `API key is now ${apiKey.active ? 'active' : 'inactive'}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all API keys for a user ADMIN ONLY 
exports.getApiKeys = async (req, res) => {
  try {
    const {name} = req.body;

    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const apiKeys = await ApiKey.find({ user: user._id });

    res.status(200).json({ message: 'API keys retrieved successfully.',
      user:{
        id: user._id,
        name: user.name
      },
      apiKeys });

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

    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }

    // Remove from Redis using raw key
    await redis.del(`apiKey:${apiKey.rawKey}`);

    // Delete from Mongo
    await ApiKey.findByIdAndDelete(apiKeyId);

    res.status(200).json({ message: 'API key deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
