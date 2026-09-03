const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", createBooking);
router.get("/", protectAdmin, getBookings);
router.put("/:id", protectAdmin, updateBooking);
router.delete("/:id", protectAdmin, deleteBooking);

module.exports = router;