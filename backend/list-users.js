import db from "./db/database.js";

console.log("Listing all users...");

db.all("SELECT id, email, role, created_at FROM users", (err, users) => {
  if (err) {
    console.error("Error listing users:", err.message);
  } else {
    console.log("Users in database:");
    users.forEach((user) => {
      console.log(
        `- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`
      );
    });
  }
  db.close();
});
