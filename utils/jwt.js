const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.ACCESS_SECRET

const REFRESH_SECRET = process.env.REFRESH_SECRET

exports.signAccessToken = (payload)=>{
    return jwt.sign(payload, ACCESS_SECRET, {expiresIn: '15m'})
}

exports.signRefreshToken = (payload)=>{
    return jwt.sign(payload, REFRESH_SECRET, {expiresIn: '7d'})
}

exports.verifyAccessToken = (token)=>{
    return jwt.verify(token, ACCESS_SECRET)
}

exports.verifyRefreshToken = (token)=>{
    return jwt.verify(token, REFRESH_SECRET)
}

exports.verifyAccessTokenAsync = (token) => 
  new Promise((resolve, reject) => {
    jwt.verify(token, ACCESS_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });

  
  //verify email token
  exports.verifyEmailToken = (token)=>{
    return jwt.verify(token, process.env.JWT_EMAIL_SECRET)
  } 