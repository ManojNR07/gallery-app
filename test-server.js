// Simple standalone test server to verify route registration
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5001; // Different port to avoid conflicts

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware for testing
const testAuth = (req, res, next) => {
  console.log("Auth middleware executed");
  req.user = { id: 1, username: "testuser" };
  next();
};

// Test routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Test server is running" });
});

// Gallery routes
const galleryRouter = express.Router();

galleryRouter.get("/test", (req, res) => {
  res.json({ message: "Gallery router is working" });
});

galleryRouter.post("/:id/comments", testAuth, (req, res) => {
  console.log("Comment route hit!");
  console.log("Gallery ID:", req.params.id);
  console.log("Comment text:", req.body.text);

  res.status(201).json({
    id: 123,
    text: req.body.text,
    user_id: req.user.id,
    gallery_id: req.params.id,
    created_at: new Date().toISOString(),
  });
});

// Register gallery routes
app.use("/api/galleries", galleryRouter);

// 404 handler
app.use((req, res) => {
  console.log("404 for path:", req.path);
  res.status(404).json({ error: "Route not found", path: req.path });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log("Try these URLs:");
  console.log(`- http://localhost:${PORT}/api/test`);
  console.log(`- http://localhost:${PORT}/api/galleries/test`);
  console.log(`- POST to http://localhost:${PORT}/api/galleries/5/comments`);
});
