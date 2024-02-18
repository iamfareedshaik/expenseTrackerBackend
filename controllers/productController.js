const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {getSearchItems, getCartitems, getcategoryItems, getCategory, updateCartProduct} = require("../models/productModel")

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  let products = await getCategory()
  res.status(200).json({
    success: true,
    products
  });
});

exports.getSearchProducts = catchAsyncErrors(async (req, res, next) => {
  const {searchtext, uuid} =  req.query
  let products = await getSearchItems(uuid,searchtext)
  res.status(200).json({
    success: true,
    products
  });
});

exports.getAllCartitems = catchAsyncErrors(async (req, res, next) => {
  let cartItems = await getCartitems(req.params.id)
  res.status(200).json({
    success: true,
    cartItems
  });
});

exports.getCategoryProducts = catchAsyncErrors(async (req, res, next) => {
  let categoryItems = await getcategoryItems(req.query.category,req.query.uuid)
  res.status(200).json({
    success: true,
    categoryItems
  });
});

exports.updateCartItem = catchAsyncErrors(async (req, res, next) => {
  const {productId, uuid} = req.body;
  await updateCartProduct(productId,uuid)
  res.status(200).json({
    success: true
  });
});