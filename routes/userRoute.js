const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  getUserDetails,
  refreshToken,
  resetPassword,
  updatepassword
} = require("../controllers/userController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/logout").get(logout);

router.route("/refresh/token").post(refreshToken)

router.route("/reset-password").post(resetPassword)

router.route("/updatepassword").post(updatepassword)

module.exports = router;
