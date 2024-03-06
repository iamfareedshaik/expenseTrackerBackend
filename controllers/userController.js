const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {
  findUser,
  createUser,
  findUserByID,
  resetMyPassword,
  updateMypassword,
} = require("../models/userModel");
const { createBag } = require("../models/basketModel");
const sendToken = require("../utils/jwtToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { phonenumber, email, password, username, secret } = req.body;
  try {
    const user = await findUser(email);
    if (user) {
      return next(new ErrorHander("user already exist", 409));
    }
    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(`'${password}'`, salt);
    const createdUser = await createUser(
      phonenumber,
      email,
      username,
      bcryptPassword,
      secret
    );
    const { payer_id } = createdUser;
    const randomUUID = uuid.v1();
    createBag(randomUUID, "Bag 1", payer_id);

    sendToken(createdUser, 201, res);
  } catch (error) {
    next(error);
  }
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await findUser(email);

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  const isPasswordMatched = await comparePassword(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }
  sendToken(
    {
      user_id: user.payer_id,
      phoneNumber: user.phonenumber,
      email: user.email,
    },
    200,
    res
  );
});

const comparePassword = async (frontEndPass, databasePass) => {
  return await bcrypt.compare(`'${frontEndPass}'`, databasePass);
};

exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const { payer_id, phonenumber, email, username } = req.user;
  const user = { payer_id, phone: phonenumber, email, name: username };
  res.status(200).json({
    success: true,
    user,
  });
});

exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
  const { refreshToken } = req.body;
  const decodedData = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await findUserByID(decodedData.id);
  sendToken(
    {
      user_id: user.payer_id,
      phoneNumber: user.phonenumber,
      email: user.email,
      username: user.username,
    },
    200,
    res
  );
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, secret } = req.body;
  const response = await resetMyPassword(email, secret);
  let match = false;
  if (response.length) {
    match = true;
  }
  res.status(200).json({
    success: match,
    response,
  });
});

exports.updatepassword = catchAsyncErrors(async (req, res, next) => {
  const { email, password, phonenumber } = req.body;
  const salt = await bcrypt.genSalt(10);
  const bcryptPassword = await bcrypt.hash(`'${password}'`, salt);
  await updateMypassword(email, bcryptPassword, phonenumber);
  res.status(200).json({
    success: true,
  });
});

// Forgot Password
// exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });

//   if (!user) {
//     return next(new ErrorHander("User not found", 404));
//   }

//   // Get ResetPassword Token
//   const resetToken = user.getResetPasswordToken();

//   await user.save({ validateBeforeSave: false });

//   const resetPasswordUrl = `${req.protocol}://${req.get(
//     "host"
//   )}/password/reset/${resetToken}`;

//   const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: `Ecommerce Password Recovery`,
//       message,
//     });

//     res.status(200).json({
//       success: true,
//       message: `Email sent to ${user.email} successfully`,
//     });
//   } catch (error) {
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;

//     await user.save({ validateBeforeSave: false });

//     return next(new ErrorHander(error.message, 500));
//   }
// });

// Reset Password
// exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
//   // creating token hash
//   const resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await User.findOne({
//     resetPasswordToken,
//     resetPasswordExpire: { $gt: Date.now() },
//   });

//   if (!user) {
//     return next(
//       new ErrorHander(
//         "Reset Password Token is invalid or has been expired",
//         400
//       )
//     );
//   }

//   if (req.body.password !== req.body.confirmPassword) {
//     return next(new ErrorHander("Password does not password", 400));
//   }

//   user.password = req.body.password;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpire = undefined;

//   await user.save();

//   sendToken(user, 200, res);
// });

// update User password
// exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findById(req.user.id).select("+password");

//   const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

//   if (!isPasswordMatched) {
//     return next(new ErrorHander("Old password is incorrect", 400));
//   }

//   if (req.body.newPassword !== req.body.confirmPassword) {
//     return next(new ErrorHander("password does not match", 400));
//   }

//   user.password = req.body.newPassword;

//   await user.save();

//   sendToken(user, 200, res);
// });

// update User Profile
// exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
//   const newUserData = {
//     name: req.body.name,
//     email: req.body.email,
//   };

//   if (req.body.avatar !== "") {
//     const user = await User.findById(req.user.id);

//     const imageId = user.avatar.public_id;

//     await cloudinary.v2.uploader.destroy(imageId);

//     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//       folder: "avatars",
//       width: 150,
//       crop: "scale",
//     });

//     newUserData.avatar = {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     };
//   }

//   const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//   res.status(200).json({
//     success: true,
//   });
// });

// // Get all users(admin)
// exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

// Get single user (admin)
// exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findById(req.params.id);

//   if (!user) {
//     return next(
//       new ErrorHander(`User does not exist with Id: ${req.params.id}`)
//     );
//   }

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// update User Role -- Admin
// exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
//   const newUserData = {
//     name: req.body.name,
//     email: req.body.email,
//     role: req.body.role,
//   };

//   await User.findByIdAndUpdate(req.params.id, newUserData, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//   res.status(200).json({
//     success: true,
//   });
// });

// Delete User --Admin
// exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findById(req.params.id);

//   if (!user) {
//     return next(
//       new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
//     );
//   }

//   const imageId = user.avatar.public_id;

//   await cloudinary.v2.uploader.destroy(imageId);

//   await user.remove();

//   res.status(200).json({
//     success: true,
//     message: "User Deleted Successfully",
//   });
// });
