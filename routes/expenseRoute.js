const express = require("express");
const { createExpense,getMyExpenses,getDetailExpense,updateExpense,getDetailHistory,clearExpenses,deleteExepnse, getTransactions } = require("../controllers/expenseController");
const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();
router
  .route("/expense/create")
  .post(isAuthenticatedUser,createExpense);
  router.route("/expense/transactions").get(isAuthenticatedUser, getTransactions)
router.route("/expense/:payerId").get(isAuthenticatedUser,getDetailExpense);
router.route("/expense").get(isAuthenticatedUser,getMyExpenses);
router.route("/expense/share/payerId").post(isAuthenticatedUser,updateExpense)
router.route("/expense/history/:payerId").get(isAuthenticatedUser,getDetailHistory)
router.route("/expense/clear/:payerId").put(isAuthenticatedUser,clearExpenses)
router.route("/expense").delete(isAuthenticatedUser,deleteExepnse)

module.exports = router;