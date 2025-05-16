import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import "./db/init.js";
import authRoutes from "./routes/auth.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import commentModel from "./models/commentModel.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";

// Initialize environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Headers:", JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body));
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/galleries",
  (req, res, next) => {
    console.log(`Accessing galleries route: ${req.method} ${req.path}`);
    console.log("Request body:", req.body);
    next();
  },
  galleryRoutes
);
app.use("/api/images", imageRoutes);

// Test endpoint to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "API server is running correctly" });
});

// List all registered routes
app.get("/api/routes", (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    } else if (middleware.name === "router") {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          routes.push({ path, methods });
        }
      });
    }
  });

  res.json(routes);
});

// Simple test route at root level
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// ENHANCED 404 HANDLER - Provides more diagnostics
app.use((req, res, next) => {
  console.log(`Route not found: ${req.method} ${req.path}`);
  console.log("Available routes:");

  // List all registered routes
  function printRoutes(stack, basePath = "") {
    stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .filter((method) => layer.route.methods[method])
          .join(", ");
        console.log(`${methods.toUpperCase()} ${basePath}${layer.route.path}`);
      } else if (layer.name === "router" && layer.handle.stack) {
        // This is a router middleware
        let path = basePath;
        if (layer.regexp && layer.regexp.source !== "^\\/?$") {
          // Extract mount path - this is a simplification
          path =
            basePath +
            layer.regexp.source
              .replace(/^\^\\\//, "/")
              .replace(/\\\/\?(?=\$)/, "")
              .replace(/\$\/?$/, "");
        }
        printRoutes(layer.handle.stack, path);
      }
    });
  }

  printRoutes(app._router.stack);

  // Special case for our problem route
  if (req.method === "POST" && req.path === "/api/galleries/5/comments") {
    console.log("THIS IS THE PROBLEMATIC ROUTE WE ARE TRYING TO FIX");
    console.log("It should be handled by the direct route above");
  }

  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Connected to SQLite database");
});

export default app;
