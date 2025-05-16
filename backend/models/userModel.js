import db from "../db/database.js";
import bcrypt from "bcrypt";

const userModel = {
  // Find user by email
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  // Get user by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id, email, role FROM users WHERE id = ?",
        [id],
        (err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  },

  // Create new user
  create: (email, password, role = "user") => {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Log the role to verify it's being passed correctly
        console.log(`Creating user with role: ${role}`);

        // Insert user with specified role
        db.run(
          "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
          [email, hashedPassword, role],
          function (err) {
            if (err) {
              reject(err);
            } else {
              // Verify the role is being returned correctly
              resolve({ id: this.lastID, email, role });
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  },

  // Get all users (for admin)
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, email, role, created_at FROM users", (err, users) => {
        if (err) {
          reject(err);
        } else {
          resolve(users);
        }
      });
    });
  },

  // Get galleries accessible to a user
  getUserGalleries: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT g.* FROM galleries g
        INNER JOIN user_gallery_access uga ON g.id = uga.gallery_id
        WHERE uga.user_id = ?
      `;

      db.all(query, [userId], (err, galleries) => {
        if (err) {
          reject(err);
        } else {
          resolve(galleries);
        }
      });
    });
  },
};

export default userModel;
