const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {updateProducts, createBag, getBasket} = require("../config/database")
const uuid = require("uuid");

exports.createBasket = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;
  const { payer_id } = req.user
  console.log('userDetails in createBasket',req.user)
  console.log("name", typeof name)
  if(!name || name.trim() ===""){
    console.log("name2",name)
    return next(new ErrorHandler("Please Enter Basket name", 400));
  }
  const randomUUID = uuid.v1();
  createBag(randomUUID, name, payer_id)
  res.status(201).json({
    success: true,
    uuid: randomUUID,
    basketName: name,
  });
});

exports.getAllBaskets = catchAsyncErrors(async (req, res, next) => {
  const { payer_id } = req.user
  let baskets = await getBasket(payer_id);
  console.log(baskets)
  res.status(200).json({
    success: true,
    baskets,
  });
});

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const {uuid, id, qty, units} = req.body
  if(!qty){
    return next(new ErrorHander("Please Enter Quantity", 400));
  }
  if(!units){
    return next(new ErrorHander("Please Enter units", 400));
  }
  
  updateProducts(uuid, id, qty, units)
  res.status(200).json({
    success: true,
  });
});
