const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
   type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  dailyLimit:{
    type: Number, 
    default:50
  },
  totalLimit: {
    type: Number,
    default: 1000,
  },
  ative: {
    type: Boolean,
    default: true,
  },
  lastRequestAt: {
    type: Date,
  },
  dailyRequests: {
    type: Number,
    default: 0,
  },
  totalRequests: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ApiKey', apiKeySchema);