// Completely rewrite the galleries routes file

const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/auth");
const db = require("../db/database"); // Adjust based on your actual database setup

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Gallery routes are working" });
});

// Get all galleries
router.get("/", authenticateJWT, async (req, res) => {
  try {
    // Your existing gallery retrieval code
    res.json({ galleries: [] }); // Replace with actual galleries
  } catch (error) {
    console.error("Error getting galleries:", error);
    res.status(500).json({ message: "Server error getting galleries" });
  }
});

// Add a comment to a gallery
router.post("/:id/comments", authenticateJWT, async (req, res) => {
  try {
    console.log("Comment request received for gallery:", req.params.id);
    console.log("Request body:", req.body);
    console.log("User from token:", req.user);

    const galleryId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Simple implementation for testing
    // Replace with your actual database logic
    const comment = {
      id: Math.floor(Math.random() * 1000),
      text,
      user_id: userId,
      gallery_id: galleryId,
      user_name: "User " + userId,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error creating comment" });
  }
});

// Add a rating to a gallery
router.post("/:id/ratings", authenticateJWT, async (req, res) => {
  try {
    console.log("Rating request received for gallery:", req.params.id);
    console.log("Request body:", req.body);

    const galleryId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;

    // Validate rating
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Simple implementation for testing
    // Replace with your actual database logic
    res.status(200).json({
      message: "Rating submitted successfully",
      user_rating: ratingValue,
      average_rating: ratingValue.toFixed(1),
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Server error submitting rating" });
  }
});

// Get all comments for a gallery
router.get("/:id/comments", authenticateJWT, async (req, res) => {
  try {
    const galleryId = req.params.id;
    console.log("Fetching comments for gallery:", galleryId);

    // Simple implementation for testing
    // Replace with your actual database logic
    const comments = [
      {
        id: 1,
        text: "This is a test comment",
        user_id: 1,
        user_name: "Test User",
        created_at: new Date().toISOString(),
      },
    ];

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error fetching comments" });
  }
});

// Get a specific gallery by ID
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const galleryId = req.params.id;
    // Your existing gallery retrieval code
    res.json({ id: galleryId, name: "Test Gallery" }); // Replace with actual gallery
  } catch (error) {
    console.error("Error getting gallery:", error);
    res.status(500).json({ message: "Server error getting gallery" });
  }
});

module.exports = router;
