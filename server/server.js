const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const prisma = require("./config/prisma");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    // Allows Postman, mobile apps and server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`Blocked by CORS: ${origin}`);

    return callback(
      new Error("This website is not allowed to access the API")
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Refaat's Vision API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: "Portfolio API is running",
      database: "PostgreSQL connected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "The selected file exceeds the 300 MB limit",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    "Only supported image and video files are allowed"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    "This website is not allowed to access the API"
  ) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(`Refaat's Vision API running on port ${PORT}`);
      console.log("PostgreSQL connected successfully");
      console.log(
        `Environment: ${process.env.NODE_ENV || "development"}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing server...`);

  try {
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));