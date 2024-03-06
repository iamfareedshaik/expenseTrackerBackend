const express = require("express");
const {
  getAllProducts,
  getAllCartitems,
  getCategoryProducts,
  getSearchProducts,
  updateCartItem,
  uploadProduct,
  updatePriceItem,
} = require("../controllers/productController");
const { isAuthenticatedUser } = require("../middleware/auth");
const uploadimage = require("../middleware/image");

const router = express.Router();

router.route("/products/upload").put(uploadimage, uploadProduct);
router.route("/cart").put(isAuthenticatedUser, updateCartItem);
router.route("/cart/updatePrice").put(isAuthenticatedUser, updatePriceItem);
router.route("/cart/:id").get(isAuthenticatedUser, getAllCartitems);
router.route("/products/category").get(isAuthenticatedUser, getAllProducts);
router.route("/products").get(isAuthenticatedUser, getCategoryProducts);
router.route("/products/search").get(isAuthenticatedUser, getSearchProducts);
module.exports = router;
