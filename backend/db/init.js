import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// Get current file's directory (required in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and execute schema
const schemaSQL = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

// Initialize database
function initDatabase() {
  // Execute schema as separate statements
  const statements = schemaSQL.split(";").filter((stmt) => stmt.trim());

  db.serialize(() => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // Run each statement
    statements.forEach((statement) => {
      if (statement.trim()) {
        db.run(statement, (err) => {
          if (err) {
            console.error("Error executing schema:", err.message);
          }
        });
      }
    });

    // Create admin user if not exists
    const saltRounds = 10;
    bcrypt.hash("admin123", saltRounds, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return;
      }

      db.get(
        "SELECT id FROM users WHERE email = ?",
        ["admin@example.com"],
        (err, user) => {
          if (err) {
            console.error("Error checking for admin user:", err);
            return;
          }

          if (!user) {
            db.run(
              "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
              ["admin@example.com", hash, "admin"],
              function (err) {
                if (err) {
                  console.error("Error creating admin user:", err);
                } else {
                  console.log("Admin user created successfully");
                }
              }
            );
          }
        }
      );
    });

    // Create tables if they don't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS galleries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        thumbnail_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if the thumbnail_path column exists, add it if not
    db.all("PRAGMA table_info(galleries)", (err, rows) => {
      if (err) {
        console.error("Error checking gallery table schema:", err);
        return;
      }

      // Check if we need to add the thumbnail_path column
      if (Array.isArray(rows)) {
        const hasColumn = rows.some((row) => row.name === "thumbnail_path");
        if (!hasColumn) {
          console.log("Adding thumbnail_path column to galleries table");
          db.run("ALTER TABLE galleries ADD COLUMN thumbnail_path TEXT");
        }
      } else {
        console.error(
          "Expected array from PRAGMA table_info but got:",
          typeof rows
        );
      }
    });

    console.log("Database initialized with tables");
  });
}

initDatabase();

// Export as ES module
export { initDatabase };

// Export as default
export default db;
