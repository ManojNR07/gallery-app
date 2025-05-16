import db from "./db/database.js";
import bcrypt from "bcrypt";

async function resetUsers() {
  // Wrap in a Promise to handle async operations
  return new Promise((resolve, reject) => {
    // Begin transaction
    db.serialize(() => {
      try {
        console.log("Starting user reset process...");

        // 1. Delete all existing users
        db.run("DELETE FROM users", function (err) {
          if (err) {
            console.error("Error deleting users:", err.message);
            return reject(err);
          }

          const deletedCount = this.changes;
          console.log(`Deleted ${deletedCount} existing users`);

          // 2. Create new admin user
          createUser("admin@example.com", "admin123", "admin")
            .then((adminId) => {
              console.log(`Created new admin user with ID: ${adminId}`);

              // 3. Create new regular user
              return createUser("user@example.com", "user123", "user");
            })
            .then((userId) => {
              console.log(`Created new regular user with ID: ${userId}`);
              resolve("User reset completed successfully");
            })
            .catch((err) => {
              console.error("Error creating users:", err);
              reject(err);
            });
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        reject(err);
      }
    });
  });
}

// Helper function to create a user
async function createUser(email, password, role) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, role],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// Run the reset
resetUsers()
  .then((message) => {
    console.log(message);
    console.log("\nNew users created:");
    console.log("1. Admin - Email: admin@example.com, Password: admin123");
    console.log("2. User - Email: user@example.com, Password: user123");
    db.close();
  })
  .catch((err) => {
    console.error("Failed to reset users:", err);
    db.close();
  });
