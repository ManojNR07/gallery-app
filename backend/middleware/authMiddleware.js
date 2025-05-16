import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authMiddleware = {
  // Middleware to authenticate JWT token
  authenticateToken: async (req, res, next) => {
    // Get authorization header
    const authHeader = req.headers.authorization;

    console.log("Auth header:", authHeader); // Debug log

    // Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid authorization header found");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Decoded token:", decoded); // Debug log

      // Find user by ID
      const user = await userModel.findById(decoded.id);

      // Check if user exists
      if (!user) {
        console.log("User not found for token");
        return res.status(401).json({ error: "User not found" });
      }

      // Add user info to request
      req.user = user;
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  },

  // Middleware to check if user is admin
  isAdmin: (req, res, next) => {
    console.log("Checking admin role. User:", req.user); // Debug log

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== "admin") {
      console.log("User is not admin. Role:", req.user.role);
      return res.status(403).json({ error: "Admin privileges required" });
    }

    next();
  },

  // Check gallery access
  hasGalleryAccess: async (req, res, next) => {
    try {
      const galleryId = parseInt(req.params.id);

      // Admins have access to all galleries
      if (req.user.role === "admin") {
        return next();
      }

      // For regular users, check if they have access
      const userGalleries = await userModel.getUserGalleries(req.user.id);
      const hasAccess = userGalleries.some(
        (gallery) => gallery.id === galleryId
      );

      if (hasAccess) {
        next();
      } else {
        res
          .status(403)
          .json({ error: "You do not have access to this gallery" });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
};

export const { authenticateToken, isAdmin, hasGalleryAccess } = authMiddleware;
export default authMiddleware;
