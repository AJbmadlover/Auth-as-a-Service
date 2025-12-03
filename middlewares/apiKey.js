const bcrypt = require('bcrypt');
const ApiKey = require('../models/apiKey');
const redis = require('../config/redis');

const MAX_TOTAL_REQUESTS = 1000;
const MAX_DAILY_REQUESTS = 50;

exports.validateApiKey = async (req, res, next) => {
  try {
    const apiKeyValue = req.headers['x-api-key'];
    if (!apiKeyValue) return res.status(401).json({ message: 'API key required' });

    const userId = await redis.get(apiKeyValue);
    if (!userId) return res.status(401).json({ message: 'Invalid API key' });

    const apiKeys = await ApiKey.find({ user: userId, active: true });

    let matchedKey = null;
    for (let key of apiKeys) {
      const match = await bcrypt.compare(apiKeyValue, key.key);
      if (match) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) return res.status(401).json({ message: 'API key inactive or invalid' });

    // Rate limiting
    const now = new Date();
    if (matchedKey.lastRequestAt && new Date(matchedKey.lastRequestAt).toDateString() !== now.toDateString()) {
      // Reset daily counter if it's a new day
      matchedKey.dailyRequests = 0;
    }

    if (matchedKey.totalRequests >= MAX_TOTAL_REQUESTS)
      return res.status(429).json({ message: 'API key exceeded total request limit' });

    if (matchedKey.dailyRequests >= MAX_DAILY_REQUESTS)
      return res.status(429).json({ message: 'API key exceeded daily request limit' });

    // Increment counters
    matchedKey.totalRequests += 1;
    matchedKey.dailyRequests += 1;
    matchedKey.lastRequestAt = now;
    await matchedKey.save();

    req.userId = userId;
    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
