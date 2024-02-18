const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {createExpense,getMyexpense, getDetailExpenses, updateExpensePayer, getMyHistory,clearExpense, deleteMyexpenses, getMyTransactions, createDeletedExp} = require("../models/expenseModel")
const {TransactionHistory} = require("../helpers/transaction")
const uuid = require("uuid");

exports.createExpense = catchAsyncErrors(async (req, res, next) => {
  const { amount,description, payee,participants, SplitType } = req.body;
  const groupid = participants[0]?.groupid
  if(!amount){
    return next(new ErrorHandler("Please Enter Amount", 400));
  }
  if(!description){
    return next(new ErrorHandler("Please Enter description", 400));
  }
  const date = new Date().toISOString();
  const randomUUID = uuid.v1();
  const response = await createExpense(randomUUID, amount,description, date, SplitType, participants ,payee.phone, groupid)
  response.forEach((person) => {
    const Historydesc = req.user.username + ' added ' +  description + ' of $' + person.share;
    TransactionHistory(req.user.payer_id, person.payer_id, Historydesc, 'create');
  });

  res.status(201).json({
    success: true
  });
});

exports.getMyExpenses = catchAsyncErrors(async (req, res, next) => {
  const {payer_id} = req.user;
    const expenses = await getMyexpense(payer_id)
    res.status(200).json({
      success: true,
      expenses
    });
  });

exports.getDetailExpense = catchAsyncErrors(async (req, res, next) => {
    const {payer_id} = req.user;
    const expenses = await getDetailExpenses(payer_id,req.params.payerId)
    res.status(200).json({
      success: true,
      expenses
    });
  });

exports.updateExpense = catchAsyncErrors(async (req, res, next) => {
  const {expense_id, payer_id, amount, description, partialAmt} = req.body;
  const {username} = req.user;
  const Historydesc = username + " updated payment of " + '$'+ partialAmt + ' for ' + description;
  const expenses = await updateExpensePayer(expense_id, payer_id, amount)
  TransactionHistory(req.user.payer_id, payer_id,Historydesc, 'updateExpense')
  res.status(200).json({
    success: true,
    expenses
  });
});

exports.getDetailHistory = catchAsyncErrors(async (req, res, next) => {
  const {payer_id} = req.user;
  const history = await getMyHistory(payer_id,req.params.payerId)
  res.status(200).json({
    success: true,
    history
  });
});

exports.clearExpenses = catchAsyncErrors(async (req, res, next) => {
  const {payer_id, username} = req.user;
  const Historydesc = username + ' settled all transactions';
  const response = await clearExpense(payer_id,req.params.payerId)
  TransactionHistory(req.user.payer_id, req.params.payerId,Historydesc, 'clearAll')
  res.status(200).json({
    success: true,
  });
});

exports.deleteExepnse = catchAsyncErrors(async (req, res, next) => {
  const { expense_id, payer_id, description, share, actualshare } = req.query;
  const {username} = req.user
  const Historydesc = username + ' deleted ' + description + ' of amount $' + share; 
  const response = await deleteMyexpenses(expense_id,payer_id)
  await TransactionHistory(req.user.payer_id, payer_id,Historydesc, 'delete')

  if(share != actualshare){
    const randomUUID = uuid.v1();
    const updateAmt = parseFloat(actualshare) - parseFloat(share);
    const delteDesc = `${username} addedBack ${description} amount $${updateAmt} `
    createDeletedExp(randomUUID, updateAmt, delteDesc, new Date().toISOString(), req.user.payer_id, payer_id)
    await TransactionHistory(req.user.payer_id, payer_id,delteDesc, 'create')
  }
  res.status(200).json({
    success: true,
  });
});

exports.getTransactions = catchAsyncErrors(async (req, res, next) => {
  const {payer_id} = req.user
  const transactions = await getMyTransactions(payer_id)
  res.status(200).json({
    success: true,
    transactions
  });
});


