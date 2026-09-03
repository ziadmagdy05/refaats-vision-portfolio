const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  addMediaToProject,
  updateMedia,
  deleteMedia,
} = require("../controllers/mediaController");

const router = express.Router();

router.post(
  "/project/:projectId",
  protectAdmin,
  upload.single("file"),
  addMediaToProject
);

router.put("/:id", protectAdmin, updateMedia);
router.delete("/:id", protectAdmin, deleteMedia);

module.exports = router;