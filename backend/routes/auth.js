import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/database.js";
import authController from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { body } from "express-validator";

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Find user in database - use explicit column selection to ensure role is retrieved
  db.get(
    "SELECT id, email, password, role FROM users WHERE email = ?",
    [email],
    (err, user) => {
      if (err) {
        console.error("Database error during login:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        console.log(`No user found with email: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Debug: Log the user object from database
      console.log("USER FROM DB:", JSON.stringify(user, null, 2));
      console.log("User role from DB:", user.role);

      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error("Password comparison error:", err);
          return res.status(500).json({ error: "Password verification error" });
        }

        if (!isMatch) {
          console.log("Password does not match for user:", email);
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Explicitly ensure role is preserved
        const userRole = user.role || "user";
        console.log(`User authenticated successfully. Role: ${userRole}`);

        // Generate JWT token with explicitly preserved role
        const tokenPayload = {
          id: user.id,
          email: user.email,
          role: userRole,
        };
        console.log("Token payload:", JSON.stringify(tokenPayload, null, 2));

        const token = jwt.sign(
          tokenPayload,
          process.env.JWT_SECRET || "your_jwt_secret",
          { expiresIn: "1h" }
        );

        // Return user info and token
        const responseData = {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: userRole,
          },
        };
        console.log("Response data:", JSON.stringify(responseData, null, 2));

        return res.json(responseData);
      });
    }
  );
});

// Get user profile
router.get("/profile", authenticateToken, authController.profile);

export default router;
