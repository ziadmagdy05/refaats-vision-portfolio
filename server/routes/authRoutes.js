const express = require("express");

const {
  setupAdmin,
  loginAdmin,
  getCurrentAdmin,
  updateAdminProfile,
  changeAdminPassword,
  createAdditionalAdmin,
  getAdmins,
} = require("../controllers/authController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/setup", setupAdmin);
router.post("/login", loginAdmin);

// Protected account routes
router.get("/me", protectAdmin, getCurrentAdmin);
router.put("/profile", protectAdmin, updateAdminProfile);
router.put("/password", protectAdmin, changeAdminPassword);

// Protected admin-management routes
router.get("/admins", protectAdmin, getAdmins);
router.post("/admins", protectAdmin, createAdditionalAdmin);

module.exports = router;