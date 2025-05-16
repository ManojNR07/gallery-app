import db from "./db/database.js";

// Direct SQL query to insert admin
const email = "direct-admin@example.com";
const password = "$2b$10$abcdefghijklmnopqrstuvwxyz"; // Pre-hashed password
const role = "admin";

db.run(
  "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
  [email, password, role],
  function (err) {
    if (err) {
      console.error("Error inserting admin user:", err.message);
    } else {
      console.log(`Admin user inserted with ID: ${this.lastID}`);

      // Verify it was inserted correctly
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
          console.error("Error verifying user:", err.message);
        } else {
          console.log("User saved in database:", user);
        }
        db.close();
      });
    }
  }
);
