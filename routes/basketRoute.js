const express = require("express");
const { createBasket, getAllBaskets, updateProduct } = require("../controllers/basketController");
const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();
router
  .route("/basket/create")
  .post(isAuthenticatedUser,createBasket);

router.route("/basket").get(isAuthenticatedUser, getAllBaskets);
router
  .route("/basket/:id")
  .put(isAuthenticatedUser,updateProduct)

module.exports = router;
