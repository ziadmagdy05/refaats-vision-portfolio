const cloudinary = require("../config/cloudinary");

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image or video",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "photographer-portfolio",
          resource_type: "auto",
        },
        (error, uploadedFile) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadedFile);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration || null,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to upload media",
    });
  }
};

module.exports = {
  uploadMedia,
};