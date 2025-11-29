const mongoose = require('mongoose');

const user =   new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },

}, {timestamps: true});

module.exports = mongoose.model('User', user);