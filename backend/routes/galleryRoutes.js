import express from "express";
import galleryModel from "../models/galleryModel.js";
import {
  authenticateToken,
  isAdmin,
  hasGalleryAccess,
} from "../middleware/authMiddleware.js";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import imageModel from "../models/imageModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import commentModel from "../models/commentModel.js";
import ratingModel from "../models/ratingModel.js";

// Initialize dotenv
dotenv.config();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for gallery thumbnails
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/galleries");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "gallery-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// Add this at the TOP of your routes (before any other routes)
router.get("/debug", (req, res) => {
  res.json({ message: "Debug route works!" });
});

router.post("/debug", (req, res) => {
  res.json({
    message: "Debug POST route works!",
    receivedData: req.body,
  });
});

// Public route to get all galleries
router.get("/", async (req, res) => {
  try {
    const galleries = await galleryModel.getAll();
    res.json({ galleries });
  } catch (err) {
    console.error("Error fetching galleries:", err);
    res.status(500).json({ error: "Failed to fetch galleries" });
  }
});

// Get gallery by ID
router.get("/:id", async (req, res) => {
  try {
    const gallery = await galleryModel.getById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    res.json({ gallery });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

// Get all images for a specific gallery
router.get("/:id/images", authenticateToken, async (req, res) => {
  try {
    const galleryId = req.params.id;

    // Validate gallery exists and user has access
    const gallery = await galleryModel.getById(galleryId);
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }

    // Get images for the gallery
    const images = await imageModel.getByGalleryId(galleryId);

    // Return the images
    res.json(images);
  } catch (err) {
    console.error("Error fetching gallery images:", err);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
});

// Admin-only routes
// Create new gallery with thumbnail
router.post(
  "/",
  authenticateToken,
  isAdmin,
  (req, res, next) => {
    console.log("Gallery creation request received");
    console.log("Request body before multer:", req.body);
    next();
  },
  upload.single("thumbnail"), // Handle file upload
  (req, res, next) => {
    console.log("After multer middleware:");
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    next();
  },
  [
    body("name").notEmpty().withMessage("Gallery name is required"),
    body("description").optional(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("Creating new gallery:", req.body);

      const { name, description } = req.body;
      // Get thumbnail path if file was uploaded
      const thumbnailPath = req.file
        ? `/uploads/galleries/${req.file.filename}`
        : null;
      console.log("Thumbnail path:", thumbnailPath);

      const gallery = await galleryModel.create({
        name,
        description,
        thumbnail_path: thumbnailPath,
      });

      console.log("Gallery created:", gallery);
      res.status(201).json({
        message: "Gallery created successfully",
        gallery,
      });
    } catch (err) {
      console.error("Error creating gallery:", err);
      res
        .status(500)
        .json({ error: "Failed to create gallery: " + err.message });
    }
  }
);

// Update gallery with thumbnail
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  upload.single("thumbnail"), // Handle file upload
  [
    body("name").notEmpty().withMessage("Gallery name is required"),
    body("description").optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;

      // Get current gallery to check if we need to delete old thumbnail
      const currentGallery = await galleryModel.getById(req.params.id);

      // Get new thumbnail path if file was uploaded
      const thumbnailPath = req.file
        ? `/uploads/galleries/${req.file.filename}`
        : currentGallery.thumbnail_path;

      const gallery = await galleryModel.update(req.params.id, {
        name,
        description,
        thumbnail_path: thumbnailPath,
      });

      res.json({ message: "Gallery updated successfully", gallery });
    } catch (err) {
      console.error("Error updating gallery:", err);
      res.status(500).json({ error: "Failed to update gallery" });
    }
  }
);

// Delete gallery
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await galleryModel.delete(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    res.json({ message: "Gallery deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery:", err);
    res.status(500).json({ error: "Failed to delete gallery" });
  }
});

// Update the GET endpoint for comments to fetch from database
router.get("/:id/comments", async (req, res) => {
  try {
    const galleryId = req.params.id;
    console.log("Fetching comments for gallery:", galleryId);

    // Fetch comments from database using a model
    // We'll need to add a method to commentModel for this
    const comments = await commentModel.getCommentsByGallery(galleryId);

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Update the POST endpoint to store comments in database
router.post("/:id/comments", async (req, res) => {
  try {
    console.log("Comment request received for gallery:", req.params.id);
    console.log("Request body:", req.body);

    const galleryId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    // Get user info from token if available
    let userId = 999;
    let userName = "Anonymous User";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        userName = decoded.email || "User " + userId;
      } catch (err) {
        console.log("Token verification failed:", err.message);
      }
    }

    // Store comment in database
    const comment = await commentModel.addGalleryComment(
      galleryId,
      userId,
      text
    );

    // Fetch the complete comment with user email
    const fullComment = await commentModel.getCommentById(comment.id);

    console.log("Created comment:", fullComment);
    res.status(201).json(fullComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Server error creating comment" });
  }
});

// Update the ratings route to store ratings in database
router.post("/:id/ratings", async (req, res) => {
  try {
    console.log("Rating request received for gallery:", req.params.id);
    console.log("Request body:", req.body);

    const galleryId = req.params.id;
    const { rating, comment } = req.body;

    // Validate rating
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Get user info
    let userId = 999;
    let userName = "Anonymous User";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        userName = decoded.email || "User " + userId;
      } catch (err) {
        console.log("Token verification failed:", err.message);
      }
    }

    // Store rating in database
    const userRating = await ratingModel.addRating(
      galleryId,
      userId,
      ratingValue
    );

    // Store comment if provided
    let userComment = null;
    if (comment && comment.trim() !== "") {
      userComment = await commentModel.addGalleryComment(
        galleryId,
        userId,
        comment
      );
      userComment = await commentModel.getCommentById(userComment.id);
    }

    // Get average rating
    const ratingStats = await ratingModel.getGalleryRatingStats(galleryId);

    res.status(201).json({
      message: "Rating submitted successfully",
      userRating,
      userComment,
      averageRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings,
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update GET ratings route to fetch from database
router.get("/:id/ratings", async (req, res) => {
  try {
    const galleryId = req.params.id;
    console.log("Fetching ratings for gallery:", galleryId);

    // Fetch ratings from database
    const ratingStats = await ratingModel.getGalleryRatingStats(galleryId);
    const ratings = await ratingModel.getGalleryRatings(galleryId);

    res.json({
      averageRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Server error fetching ratings" });
  }
});

// Add this endpoint to get all comments with count
router.get("/comments", async (req, res) => {
  try {
    console.log("Fetching all comments");

    // Get page and limit for pagination (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Fetch comments from database
    const comments = await commentModel.getAllGalleryComments(limit, offset);

    // Get total count of comments
    const totalCount = await commentModel.getGalleryCommentsCount();

    res.json({
      comments,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    });
  } catch (error) {
    console.error("Error fetching all comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add this endpoint to get comments count by gallery
router.get("/comments/count", async (req, res) => {
  try {
    console.log("Fetching comment counts by gallery");

    // Fetch counts grouped by gallery
    const counts = await commentModel.getCommentCountsByGallery();

    res.json(counts);
  } catch (error) {
    console.error("Error fetching comment counts:", error);
    res.status(500).json({ error: "Failed to fetch comment counts" });
  }
});

// Add this endpoint to get rating summaries for all galleries
router.get("/ratings/summary", async (req, res) => {
  try {
    console.log("Fetching rating summaries for all galleries");

    // Get rating summaries from the database
    const summaries = await ratingModel.getRatingSummaries();

    res.json(summaries);
  } catch (error) {
    console.error("Error fetching rating summaries:", error);
    res.status(500).json({ error: "Failed to fetch rating summaries" });
  }
});

export default router;
