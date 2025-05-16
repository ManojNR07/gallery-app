import express from "express";
import registrationController from "../controllers/registrationController.js";
import { body } from "express-validator";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import db from "../db/database.js";

const router = express.Router();

// Public registration route
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["user", "admin"])
      .withMessage("Role must be 'user' or 'admin'"),
  ],
  registrationController.registerUser
);

// Add this special route for directly creating an admin
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log the direct admin creation attempt
    console.log("Creating admin directly:", email);

    // Check if email already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Force role to be admin
    const role = "admin";

    // Insert directly into database
    db.run(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, await bcrypt.hash(password, 10), role],
      function (err) {
        if (err) {
          console.error("Direct admin creation error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        // Get the inserted user
        db.get(
          "SELECT id, email, role FROM users WHERE id = ?",
          [this.lastID],
          (err, user) => {
            if (err) {
              console.error("Error retrieving created admin:", err);
              return res.status(500).json({ error: "Database error" });
            }

            console.log("Admin created with data:", user);
            res.status(201).json({
              message: "Admin created successfully",
              user,
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Admin creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
