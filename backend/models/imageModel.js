import db from "../db/database.js";

const imageModel = {
  // Get all images for a gallery
  getAllByGallery: (galleryId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM images WHERE gallery_id = ?",
        [galleryId],
        (err, images) => {
          if (err) {
            reject(err);
          } else {
            resolve(images);
          }
        }
      );
    });
  },

  // Get image by ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM images WHERE id = ?", [id], (err, image) => {
        if (err) {
          reject(err);
        } else {
          resolve(image);
        }
      });
    });
  },

  // Create new image
  create: (imageData) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO images (gallery_id, name, description, file_path) VALUES (?, ?, ?, ?)",
        [
          imageData.gallery_id,
          imageData.name,
          imageData.description,
          imageData.file_path,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...imageData });
          }
        }
      );
    });
  },

  // Update image
  update: (id, imageData) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE images SET name = ?, description = ? WHERE id = ?",
        [imageData.name, imageData.description, id],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...imageData });
          }
        }
      );
    });
  },

  // Delete image
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM images WHERE id = ?", [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  },

  // Get image with comments and ratings
  getWithComments: (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM images WHERE id = ?", [id], (err, image) => {
        if (err) {
          reject(err);
          return;
        }

        if (!image) {
          resolve(null);
          return;
        }

        db.all(
          `SELECT c.*, u.email as user_email 
           FROM comments c 
           JOIN users u ON c.user_id = u.id 
           WHERE c.image_id = ?`,
          [id],
          (err, comments) => {
            if (err) {
              reject(err);
            } else {
              // Calculate average rating
              let avgRating = 0;
              if (comments.length > 0) {
                avgRating =
                  comments.reduce(
                    (sum, comment) => sum + (comment.rating || 0),
                    0
                  ) / comments.length;
              }

              resolve({
                ...image,
                comments,
                avgRating: parseFloat(avgRating.toFixed(1)),
              });
            }
          }
        );
      });
    });
  },

  // Get all images for a gallery
  getByGalleryId: (galleryId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM images 
        WHERE gallery_id = ?
        ORDER BY created_at DESC
      `;

      db.all(query, [galleryId], (err, images) => {
        if (err) {
          console.error("Database error getting gallery images:", err);
          reject(err);
          return;
        }

        // Process image paths to make them accessible from frontend
        const processedImages = images.map((image) => {
          return {
            ...image,
            // Ensure file_path starts with /uploads if it's a relative path
            file_path: image.file_path.startsWith("/")
              ? image.file_path
              : `/uploads/${image.file_path}`,
          };
        });

        resolve(processedImages || []);
      });
    });
  },

  // Get a single image by ID
  getById: (imageId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM images 
        WHERE id = ?
      `;

      db.get(query, [imageId], (err, image) => {
        if (err) {
          console.error("Database error getting image:", err);
          reject(err);
          return;
        }

        if (image) {
          // Ensure file_path starts with /uploads if it's a relative path
          image.file_path = image.file_path.startsWith("/")
            ? image.file_path
            : `/uploads/${image.file_path}`;
        }

        resolve(image);
      });
    });
  },
};

export default imageModel;
