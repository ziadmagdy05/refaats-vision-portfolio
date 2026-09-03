const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith("video/")
      ? "video"
      : "image";

    const uploadStream =
      cloudinary.uploader.upload_chunked_stream(
        {
          folder: "photographer-portfolio/projects",
          resource_type: resourceType,

          // Cloudinary sends the file in 20 MB pieces
          chunk_size: 20 * 1024 * 1024,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          /*
           * Cloudinary may return intermediate responses after chunks.
           * Only resolve when the complete upload has finished.
           */
          if (result?.done === false) {
            return;
          }

          resolve(result);
        }
      );

    uploadStream.on("error", reject);
    uploadStream.end(fileBuffer);
  });
};

const addMediaToProject = async (req, res) => {
  let uploadedFile;

  try {
    const { projectId } = req.params;
    const { altText, displayOrder } = req.body || {};

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image or video",
      });
    }

    uploadedFile = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype
    );

    if (!uploadedFile?.secure_url) {
      throw new Error("Cloudinary did not return an uploaded file");
    }

    const mediaType =
      uploadedFile.resource_type === "video"
        ? "VIDEO"
        : "IMAGE";

    const parsedDisplayOrder = Number(displayOrder);

    const media = await prisma.media.create({
      data: {
        projectId,
        type: mediaType,
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        altText: altText?.trim() || null,
        displayOrder: Number.isFinite(parsedDisplayOrder)
          ? parsedDisplayOrder
          : 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Media added to project successfully",
      data: {
        media,
      },
    });
  } catch (error) {
    console.error("Add project media error:", error);

    if (uploadedFile?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          uploadedFile.public_id,
          {
            resource_type: uploadedFile.resource_type,
            invalidate: true,
          }
        );
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup error:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to add media to project",
    });
  }
};

const updateMedia = async (req, res) => {
  try {
    const { altText, displayOrder } = req.body || {};

    const existingMedia = await prisma.media.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingMedia) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    const updateData = {};

    if (altText !== undefined) {
      updateData.altText = altText?.trim() || null;
    }

    if (displayOrder !== undefined) {
      const parsedDisplayOrder = Number(displayOrder);

      if (!Number.isFinite(parsedDisplayOrder)) {
        return res.status(400).json({
          success: false,
          message: "Display order must be a number",
        });
      }

      updateData.displayOrder = parsedDisplayOrder;
    }

    const media = await prisma.media.update({
      where: {
        id: req.params.id,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Media updated successfully",
      data: {
        media,
      },
    });
  } catch (error) {
    console.error("Update media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update media",
    });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type:
          media.type === "VIDEO" ? "video" : "image",
        invalidate: true,
      });
    }

    await prisma.media.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete media",
    });
  }
};

module.exports = {
  addMediaToProject,
  updateMedia,
  deleteMedia,
};