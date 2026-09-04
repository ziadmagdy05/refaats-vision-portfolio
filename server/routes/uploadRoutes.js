const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createUploadSignature,
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/signature",
  protectAdmin,
  createUploadSignature
);

module.exports = router;