const multer = require("multer");

// const upload = multer({ dest: "../public/data/uploads/" });
// const uploadimage = upload.single("image");

const storage = multer.memoryStorage();
const uploadimage = multer({ storage });
module.exports = uploadimage.single("image");
