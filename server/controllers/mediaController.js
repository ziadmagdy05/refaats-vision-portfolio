const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary");

const validResourceTypes = ["image", "video"];
const projectFolder = "photographer-portfolio/projects/";

const addMediaToProject = async (req, res) => {
  let verifiedAsset;

  try {
    const { projectId } = req.params;

    const {
      publicId,
      resourceType,
      altText,
      displayOrder,
    } = req.body || {};

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

    const normalizedResourceType =
      resourceType?.toLowerCase();

    if (
      !publicId ||
      !validResourceTypes.includes(normalizedResourceType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cloudinary public ID and resource type are required",
      });
    }

    if (!publicId.startsWith(projectFolder)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project media location",
      });
    }

    /*
     * Verify that the uploaded asset genuinely exists inside
     * this Cloudinary account. We do not trust a URL supplied
     * directly by the browser.
     */
    verifiedAsset = await cloudinary.api.resource(publicId, {
      resource_type: normalizedResourceType,
    });

    if (!verifiedAsset?.secure_url) {
      throw new Error(
        "Cloudinary could not verify the uploaded media"
      );
    }

    const parsedDisplayOrder = Number(displayOrder);

    const media = await prisma.media.create({
      data: {
        projectId,
        type:
          normalizedResourceType === "video"
            ? "VIDEO"
            : "IMAGE",
        url: verifiedAsset.secure_url,
        publicId: verifiedAsset.public_id,
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

    /*
     * If Cloudinary accepted the upload but Prisma failed,
     * remove the unused Cloudinary asset.
     */
    if (verifiedAsset?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          verifiedAsset.public_id,
          {
            resource_type:
              verifiedAsset.resource_type || "image",
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