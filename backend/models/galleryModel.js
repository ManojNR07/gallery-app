import db from "../db/database.js";

const galleryModel = {
  // Get all galleries
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM galleries ORDER BY id DESC", (err, rows) => {
        if (err) {
          console.error("Database error in getAll galleries:", err);
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  },

  // Get gallery by ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM galleries WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Database error in getById gallery:", err);
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Create new gallery
  create: (galleryData) => {
    return new Promise((resolve, reject) => {
      const { name, description, thumbnail_path } = galleryData;
      const createdAt = new Date().toISOString();

      console.log("Creating gallery with data:", {
        name,
        description,
        thumbnail_path,
        createdAt,
      });

      db.run(
        "INSERT INTO galleries (name, description, thumbnail_path, created_at) VALUES (?, ?, ?, ?)",
        [name, description || "", thumbnail_path || null, createdAt],
        function (err) {
          if (err) {
            console.error("Database error creating gallery:", err);
            reject(err);
            return;
          }

          console.log("Gallery created successfully with ID:", this.lastID);
          // Return the newly created gallery with its ID
          galleryModel
            .getById(this.lastID)
            .then((gallery) => resolve(gallery))
            .catch((err) => reject(err));
        }
      );
    });
  },

  // Update gallery
  update: (id, galleryData) => {
    return new Promise((resolve, reject) => {
      const { name, description, thumbnail_path } = galleryData;

      db.run(
        "UPDATE galleries SET name = ?, description = ?, thumbnail_path = ? WHERE id = ?",
        [name, description || "", thumbnail_path || null, id],
        function (err) {
          if (err) {
            console.error("Database error updating gallery:", err);
            reject(err);
            return;
          }

          if (this.changes === 0) {
            resolve(null); // Gallery not found
          } else {
            // Return the updated gallery
            galleryModel
              .getById(id)
              .then((gallery) => resolve(gallery))
              .catch((err) => reject(err));
          }
        }
      );
    });
  },

  // Delete gallery
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM galleries WHERE id = ?", [id], function (err) {
        if (err) {
          console.error("Database error deleting gallery:", err);
          reject(err);
          return;
        }

        resolve({ deleted: this.changes > 0 });
      });
    });
  },

  // Assign user to gallery
  assignUser: (userId, galleryId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO user_gallery_access (user_id, gallery_id) VALUES (?, ?)",
        [userId, galleryId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, userId, galleryId });
          }
        }
      );
    });
  },

  // Remove user from gallery
  removeUser: (userId, galleryId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM user_gallery_access WHERE user_id = ? AND gallery_id = ?",
        [userId, galleryId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ removed: this.changes > 0 });
          }
        }
      );
    });
  },

  // Get users with access to a gallery
  getUsersWithAccess: (galleryId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.email, u.role 
        FROM users u
        JOIN user_gallery_access uga ON u.id = uga.user_id
        WHERE uga.gallery_id = ?
      `;

      db.all(query, [galleryId], (err, users) => {
        if (err) {
          console.error(
            "Database error getting users with gallery access:",
            err
          );
          reject(err);
          return;
        }
        resolve(users || []);
      });
    });
  },
};

export default galleryModel;
