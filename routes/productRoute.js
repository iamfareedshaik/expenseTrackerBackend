const express = require("express");
const {
  getAllProducts,
  getAllCartitems,
  getCategoryProducts,
  getSearchProducts,
  updateCartItem
} = require("../controllers/productController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

router.route("/cart").put(isAuthenticatedUser,updateCartItem);
router.route("/cart/:id").get(isAuthenticatedUser,getAllCartitems);
router.route("/products/category").get(isAuthenticatedUser,getAllProducts);
router.route("/products").get(isAuthenticatedUser,getCategoryProducts);
router.route("/products/search").get(isAuthenticatedUser,getSearchProducts);
module.exports = router;
