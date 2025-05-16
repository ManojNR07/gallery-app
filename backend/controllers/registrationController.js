import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";

const registrationController = {
  // Register new regular user (public access)
  registerUser: async (req, res) => {
    try {
      const { email, password, role } = req.body;

      // Log received data for debugging
      console.log("Registration request received:");
      console.log("Email:", email);
      console.log("Role requested:", role);
      console.log("Role type:", typeof role);

      // Check if email already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // FIX: Properly validate role by doing a strict string comparison
      // This is the key fix to ensure the role is correctly recognized
      const validRole = role === "admin" ? "admin" : "user";
      console.log("Role comparison:", role === "admin");
      console.log("Final role being saved:", validRole);

      // Create new user with the specified role
      const newUser = await userModel.create(email, password, validRole);
      console.log("User created with role:", newUser.role);

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};

export default registrationController;
