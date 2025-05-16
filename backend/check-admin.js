import db from "./db/database.js";

console.log("Checking admin user...");

db.get(
  "SELECT id, email, role FROM users WHERE role = 'admin'",
  (err, admin) => {
    if (err) {
      console.error("Error checking admin user:", err.message);
    } else if (admin) {
      console.log("✅ Admin user exists:", admin);
    } else {
      console.log("❌ No admin user found in database");
    }
    db.close();
  }
);
