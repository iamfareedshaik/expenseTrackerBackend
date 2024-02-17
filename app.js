const express = require("express");
const app = express();
const cors  = require('cors');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const errorMiddleware = require("./middleware/error");

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}
app.use(cors())
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Route Imports
const product = require("./routes/productRoute");
const basketRoute = require("./routes/basketRoute")
const expenseRoute = require("./routes/expenseRoute")
const userRoute = require("./routes/userRoute")
app.use("/api/v1", product);
app.use("/api/v1",basketRoute)
app.use("/api/v1",expenseRoute)
app.use("/api/v1",userRoute)

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
