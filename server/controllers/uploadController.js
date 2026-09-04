const cloudinary = require("../config/cloudinary");

const validResourceTypes = ["image", "video"];

const createUploadSignature = async (req, res) => {
  try {
    const requestedType =
      req.body?.resourceType?.toLowerCase();

    if (!validResourceTypes.includes(requestedType)) {
      return res.status(400).json({
        success: false,
        message: "Resource type must be image or video",
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "photographer-portfolio/projects";

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        signature,
        resourceType: requestedType,
      },
    });
  } catch (error) {
    console.error("Create upload signature error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to prepare media upload",
    });
  }
};

module.exports = {
  createUploadSignature,
};