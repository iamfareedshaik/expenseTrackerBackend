// Create Token and saving in cookie
const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  const accessToken = getJWTToken(user.user_id);
  const refreshToken = getRefreshToken(user.user_id);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    refreshToken
  });
};

const getJWTToken = (user_id) => {
  return jwt.sign({ id: user_id, version: process.env.TOKEN_VERSION}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const getRefreshToken = (user_id) => {
  return jwt.sign({ id: user_id, version: process.env.TOKEN_VERSION }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_JWT_EXPIRE,
  });
};

module.exports = sendToken;
