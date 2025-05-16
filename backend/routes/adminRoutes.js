import express from "express";
import authController from "../controllers/authController.js";
import { body } from "express-validator";
import userModel from "../models/userModel.js";
import authMiddleware from "../middleware/authMiddleware.js";
import galleryModel from "../models/galleryModel.js";

const router = express.Router();

// Test route - NO authentication required
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working" });
});

// Admin-only routes
router.use(authMiddleware.authenticateToken, authMiddleware.isAdmin);

// Register new user
router.post(
  "/users",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["admin", "user"])
      .withMessage("Role must be either admin or user"),
  ],
  authController.register
);

// Get all users
router.get("/users", async (req, res) => {
  try {
    console.log("Get all users endpoint accessed by admin");
    const users = await userModel.getAll();
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get users with access to a specific gallery
router.get("/gallery-access/:id", async (req, res) => {
  try {
    const galleryId = req.params.id;
    console.log(`Fetching users with access to gallery ID: ${galleryId}`);

    // Validate galleryId
    if (!galleryId || isNaN(parseInt(galleryId))) {
      console.error(`Invalid gallery ID: ${galleryId}`);
      return res.status(400).json({ error: "Invalid gallery ID" });
    }

    const usersWithAccess = await galleryModel.getUsersWithAccess(galleryId);
    console.log(
      `Found ${usersWithAccess.length} users with access to gallery ${galleryId}`
    );
    res.json({ users: usersWithAccess });
  } catch (err) {
    console.error(
      `Error fetching gallery access for gallery ID ${req.params.id}:`,
      err
    );
    res
      .status(500)
      .json({ error: "Failed to fetch gallery access information" });
  }
});

// Grant gallery access to a user
router.post("/gallery-access", async (req, res) => {
  try {
    const { userId, galleryId } = req.body;

    // Validate input
    if (!userId || !galleryId) {
      return res
        .status(400)
        .json({ error: "User ID and Gallery ID are required" });
    }

    const result = await galleryModel.assignUser(userId, galleryId);
    res.status(201).json({
      message: "Gallery access granted successfully",
      result,
    });
  } catch (err) {
    console.error("Error granting gallery access:", err);
    res.status(500).json({ error: "Failed to grant gallery access" });
  }
});

// Revoke gallery access from a user
router.delete("/gallery-access/:userId/:galleryId", async (req, res) => {
  try {
    const { userId, galleryId } = req.params;
    const result = await galleryModel.removeUser(userId, galleryId);
    res.json({
      message: "Gallery access revoked successfully",
      result,
    });
  } catch (err) {
    console.error("Error revoking gallery access:", err);
    res.status(500).json({ error: "Failed to revoke gallery access" });
  }
});

// Get all galleries for dropdown selection
router.get("/available-galleries", async (req, res) => {
  try {
    console.log("Fetching all galleries for admin dropdown");
    const galleries = await galleryModel.getAll();
    res.json({ galleries });
  } catch (err) {
    console.error("Error fetching galleries for dropdown:", err);
    res.status(500).json({ error: "Failed to fetch galleries" });
  }
});

// Delete a user (admin only)
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }

    // Delete user from DB
    const db = (await import("../db/database.js")).default;
    db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Failed to delete user" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
