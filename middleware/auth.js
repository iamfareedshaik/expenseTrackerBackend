const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const { findUserByID } = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await findUserByID(decodedData.id);
    next();
  } catch (error) {
    // Token verification failed
    if (error.name === "TokenExpiredError") {
      // Token has expired, handle accordingly (e.g., initiate refresh)
      return next(new ErrorHander("Token has expired", 401));
    } else {
      // Other token verification errors
      return next(new ErrorHander("Invalid token", 401));
    }
  }
});
