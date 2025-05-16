import express from "express";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import commentModel from "../models/commentModel.js";

const router = express.Router();

// Get image details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    // Add your image fetching logic here
    res.json({ message: "Image details endpoint" });
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// Get comments for an image
router.get("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const imageId = req.params.id;
    const comments = await commentModel.getCommentsByImage(imageId);
    res.json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment to an image
router.post("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;
    const { comment, rating } = req.body;

    // Validate input
    if (!comment) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const result = await commentModel.addComment(
      imageId,
      userId,
      comment,
      rating
    );
    res.status(201).json({
      message: "Comment added successfully",
      commentId: result.id,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
