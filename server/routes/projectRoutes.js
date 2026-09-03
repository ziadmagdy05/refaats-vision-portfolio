const express = require("express");

const {
  getPublishedProjects,
  getProjectBySlug,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getPublishedProjects);

// Admin routes
router.get("/admin/all", protectAdmin, getAllProjects);
router.post("/", protectAdmin, createProject);
router.put("/:id", protectAdmin, updateProject);
router.delete("/:id", protectAdmin, deleteProject);

// Keep dynamic slug route last
router.get("/:slug", getProjectBySlug);

module.exports = router;