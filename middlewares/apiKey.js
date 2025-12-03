const bcrypt = require('bcrypt');
const ApiKey = require('../models/apiKey');
const redis = require('../config/redis');

const MAX_TOTAL_REQUESTS = 1000; // total requests per key
const MAX_DAILY_REQUESTS = 50; //total daily requests per key
const MAX_FAILED_ATTEMPTS = 5;   // Max failed attempts per key+IP
const BLOCK_DURATION = 60 * 5;   // 5 minutes in seconds

exports.validateApiKey = async (req, res, next) => {
  try {
    const apiKeyValue = req.headers['x-api-key'];
    if (!apiKeyValue) {
      return res.status(401).json({ message: 'API key required' });
    }

    const ip = req.ip; // or req.headers['x-forwarded-for'] if behind proxy
    const bfKey = `bf:${apiKeyValue}:${ip}`; // Track failed attempts per key+IP

    // -----------------------------
    // 1️⃣ Check if blocked
    // -----------------------------
    const blocked = await redis.get(bfKey);
    if (blocked) {
      const ttl = await redis.ttl(bfKey);
      res.setHeader('Retry-After', ttl);
      return res.status(429).json({
        message: `API key temporarily blocked due to repeated failed attempts. Try again in ${ttl} seconds.`
      });
    }

    // -----------------------------
    // 2️⃣ Redis lookup for valid API key
    // -----------------------------
    const userId = await redis.get(`apiKey:${apiKeyValue}`);
    if (!userId) {
      // Increment brute-force counter
      const attempts = await redis.incr(bfKey);
      if (attempts === 1) await redis.expire(bfKey, BLOCK_DURATION);
      else if (attempts >= MAX_FAILED_ATTEMPTS) {
        const ttl = await redis.ttl(bfKey);
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          message: `API key temporarily blocked due to repeated failed attempts. Try again in ${ttl} seconds.`
        });
      }

      return res.status(401).json({ message: 'Invalid or expired API key' });
    }

    // -----------------------------
    // 3️⃣ Verify hashed API key in MongoDB
    // -----------------------------
    const userApiKeys = await ApiKey.find({ user: userId, active: true });

    if (!userApiKeys.length) {
      return res.status(403).json({ message: 'No active API keys found' });
    }

    let matchedKey = null;
    for (let key of userApiKeys) {
      const valid = await bcrypt.compare(apiKeyValue, key.key);
      if (valid) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      // Increment brute-force counter
      const attempts = await redis.incr(bfKey);
      if (attempts === 1) await redis.expire(bfKey, BLOCK_DURATION);
      else if (attempts >= MAX_FAILED_ATTEMPTS) {
        const ttl = await redis.ttl(bfKey);
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          message: `API key temporarily blocked due to repeated failed attempts. Try again in ${ttl} seconds.`
        });
      }

      return res.status(401).json({ message: 'API key inactive or invalid' });
    }

    // -----------------------------
    // 4️⃣ RATE LIMITING
    // -----------------------------
    const now = new Date();
    const isNewDay =
      matchedKey.lastRequestAt &&
      new Date(matchedKey.lastRequestAt).toDateString() !== now.toDateString();

    if (isNewDay) matchedKey.dailyRequests = 0;

    if (matchedKey.totalRequests >= MAX_TOTAL_REQUESTS) {
      return res.status(429).json({ message: 'API key exceeded total request limit' });
    }

    if (matchedKey.dailyRequests >= MAX_DAILY_REQUESTS) {
      return res.status(429).json({ message: 'API key exceeded daily request limit' });
    }

    matchedKey.totalRequests += 1;
    matchedKey.dailyRequests += 1;
    matchedKey.lastRequestAt = now;
    await matchedKey.save();

    // -----------------------------
    // 5️⃣ Clear brute-force counter on success
    // -----------------------------
    await redis.del(bfKey);

    // Attach user for downstream controllers
    req.userId = userId;

    next();

  } catch (err) {
    console.error('API Key Middleware Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
