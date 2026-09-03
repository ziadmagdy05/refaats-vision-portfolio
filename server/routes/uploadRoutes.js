const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadMedia } = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/",
  protectAdmin,
  upload.single("file"),
  uploadMedia
);

module.exports = router;