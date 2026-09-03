const prisma = require("../config/prisma");

const validProjectTypes = [
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "MIXED",
];

const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (title) => {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Public: get published projects
const getPublishedProjects = async (req, res) => {
  try {
    const { type, featured } = req.query;

    const where = {
      published: true,
    };

    if (type && validProjectTypes.includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (featured === "true") {
      where.featured = true;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        media: {
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (error) {
    console.error("Get published projects error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve projects",
    });
  }
};

// Public: get one published project
const getProjectBySlug = async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        slug: req.params.slug,
        published: true,
      },
      include: {
        media: {
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve project",
    });
  }
};

// Admin: get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        media: {
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (error) {
    console.error("Get admin projects error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve projects",
    });
  }
};

// Admin: create project
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      coverUrl,
      clientName,
      location,
      projectDate,
      featured,
      published,
      displayOrder,
    } = req.body;

    if (!title || !description || !category || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, and type are required",
      });
    }

    const normalizedType = type.toUpperCase();

    if (!validProjectTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be PHOTOGRAPHY, VIDEOGRAPHY, or MIXED",
      });
    }

    const slug = await generateUniqueSlug(title);

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        category: category.trim(),
        type: normalizedType,
        coverUrl: coverUrl || null,
        clientName: clientName || null,
        location: location || null,
        projectDate: projectDate ? new Date(projectDate) : null,
        featured: featured ?? false,
        published: published ?? true,
        displayOrder: Number(displayOrder) || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: { project },
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
};

// Admin: update project
const updateProject = async (req, res) => {
  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const {
      title,
      description,
      category,
      type,
      coverUrl,
      clientName,
      location,
      projectDate,
      featured,
      published,
      displayOrder,
    } = req.body;

    if (type && !validProjectTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Type must be PHOTOGRAPHY, VIDEOGRAPHY, or MIXED",
      });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description.trim(),
        }),
        ...(category !== undefined && {
          category: category.trim(),
        }),
        ...(type !== undefined && {
          type: type.toUpperCase(),
        }),
        ...(coverUrl !== undefined && {
          coverUrl: coverUrl || null,
        }),
        ...(clientName !== undefined && {
          clientName: clientName || null,
        }),
        ...(location !== undefined && {
          location: location || null,
        }),
        ...(projectDate !== undefined && {
          projectDate: projectDate ? new Date(projectDate) : null,
        }),
        ...(featured !== undefined && { featured }),
        ...(published !== undefined && { published }),
        ...(displayOrder !== undefined && {
          displayOrder: Number(displayOrder),
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: { project },
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
};

// Admin: delete project
const deleteProject = async (req, res) => {
  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete project",
    });
  }
};

module.exports = {
  getPublishedProjects,
  getProjectBySlug,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
};