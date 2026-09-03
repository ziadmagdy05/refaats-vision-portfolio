const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicAdminSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

const generateToken = (adminId) => {
  return jwt.sign(
    { adminId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const validateAdminDetails = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "Name, email, and password are required";
  }

  if (!emailPattern.test(email.trim().toLowerCase())) {
    return "Please provide a valid email address";
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters";
  }

  return null;
};

// Public: create the first admin only
const setupAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const validationError = validateAdminDetails({
      name,
      email,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: "Admin setup has already been completed",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: publicAdminSelect,
    });

    const token = generateToken(admin.id);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create admin",
    });
  }
};

// Public: admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(admin.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

// Protected: get logged-in admin
const getCurrentAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      admin: req.admin,
    },
  });
};

// Protected: update own name or email
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body || {};

    if (name === undefined && email === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a name or email to update",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      updateData.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email)
        .trim()
        .toLowerCase();

      if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const existingAdmin = await prisma.admin.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (
        existingAdmin &&
        existingAdmin.id !== req.admin.id
      ) {
        return res.status(409).json({
          success: false,
          message: "That email is already used by another admin",
        });
      }

      updateData.email = normalizedEmail;
    }

    const admin = await prisma.admin.update({
      where: {
        id: req.admin.id,
      },
      data: updateData,
      select: publicAdminSelect,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// Protected: change own password
const changeAdminPassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body || {};

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password, and confirmation are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        id: req.admin.id,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: {
        id: req.admin.id,
      },
      data: {
        passwordHash,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change admin password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

// Protected: add another admin
const createAdditionalAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const validationError = validateAdminDetails({
      name,
      email,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingAdmin = await prisma.admin.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An admin with that email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: publicAdminSelect,
    });

    return res.status(201).json({
      success: true,
      message: "Additional admin created successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Create additional admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create additional admin",
    });
  }
};

// Protected: list all admins
const getAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: publicAdminSelect,
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: {
        admins,
      },
    });
  } catch (error) {
    console.error("Get admins error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admins",
    });
  }
};

module.exports = {
  setupAdmin,
  loginAdmin,
  getCurrentAdmin,
  updateAdminProfile,
  changeAdminPassword,
  createAdditionalAdmin,
  getAdmins,
};