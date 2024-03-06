const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const AWS = require("aws-sdk");
const fs = require("fs");
const config = require("../config/config");
AWS.config.update(config);

const s3 = new AWS.S3();

const {
  getSearchItems,
  getCartitems,
  getcategoryItems,
  getCategory,
  updateCartProduct,
  uploadProduct,
  updateProductPrice,
} = require("../models/productModel");

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  let products = await getCategory();
  res.status(200).json({
    success: true,
    products,
  });
});

exports.getSearchProducts = catchAsyncErrors(async (req, res, next) => {
  const { searchtext, uuid } = req.query;
  let products = await getSearchItems(uuid, searchtext);
  res.status(200).json({
    success: true,
    products,
  });
});

exports.getAllCartitems = catchAsyncErrors(async (req, res, next) => {
  let cartItems = await getCartitems(req.params.id);
  res.status(200).json({
    success: true,
    cartItems,
  });
});

exports.getCategoryProducts = catchAsyncErrors(async (req, res, next) => {
  let categoryItems = await getcategoryItems(
    req.query.category,
    req.query.uuid
  );
  res.status(200).json({
    success: true,
    categoryItems,
  });
});

exports.updateCartItem = catchAsyncErrors(async (req, res, next) => {
  const { productId, uuid } = req.body;
  await updateCartProduct(productId, uuid);
  res.status(200).json({
    success: true,
  });
});

exports.updatePriceItem = catchAsyncErrors(async (req, res, next) => {
  const { productId, uuid, amount } = req.body;
  await updateProductPrice(productId, uuid, amount);
  res.status(200).json({
    success: true,
  });
});

exports.uploadProduct = catchAsyncErrors(async (req, res, next) => {
  const { image, name, bucket, uuid } = req.body;
  const image_name = `${name}-${new Date().toISOString()}`;
  const buffer = Buffer.from(image, "base64");
  const params = {
    Bucket: `expensebucketfareed/${bucket}`,
    Key: image_name,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/jpg", // Adjust the content type according to your image format
  };
  console.log(params);
  const response = await s3.putObject(params).promise();
  await uploadProduct(name, image_name, bucket, uuid);
  console.log(response);
  res.status(200).json({
    success: true,
  });
});
