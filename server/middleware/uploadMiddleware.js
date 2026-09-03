const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only supported image and video files are allowed"),
      false
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300 MB
    files: 1,
  },
});

module.exports = upload;