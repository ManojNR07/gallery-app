import db from "../db/database.js";

const commentModel = {
  // Get all comments for an image
  getCommentsByImage: (imageId) => {
    return new Promise((resolve, reject) => {
      const query = `
                SELECT c.*, u.email as user_email
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.image_id = ?
                ORDER BY c.created_at DESC
            `;

      db.all(query, [imageId], (err, comments) => {
        if (err) {
          console.error("Database error getting comments:", err);
          reject(err);
          return;
        }
        resolve(comments || []);
      });
    });
  },

  // Add a new comment
  addComment: (imageId, userId, comment, rating) => {
    return new Promise((resolve, reject) => {
      const query = `
                INSERT INTO comments (image_id, user_id, comment, rating)
                VALUES (?, ?, ?, ?)
            `;

      db.run(query, [imageId, userId, comment, rating], function (err) {
        if (err) {
          console.error("Database error adding comment:", err);
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  },

  // Get all comments for a gallery
  getCommentsByGallery: (galleryId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT gc.*, u.email as user_email
        FROM gallery_comments gc
        JOIN users u ON gc.user_id = u.id
        WHERE gc.gallery_id = ?
        ORDER BY gc.created_at DESC
      `;

      db.all(query, [galleryId], (err, comments) => {
        if (err) {
          console.error("Database error getting gallery comments:", err);
          reject(err);
          return;
        }
        resolve(comments || []);
      });
    });
  },

  // Add a new comment for a gallery
  addGalleryComment: (galleryId, userId, comment) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO gallery_comments (gallery_id, user_id, comment)
        VALUES (?, ?, ?)
      `;

      db.run(query, [galleryId, userId, comment], function (err) {
        if (err) {
          console.error("Database error adding gallery comment:", err);
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  },

  // Get a comment by ID
  getCommentById: (commentId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.*, u.email as user_email
        FROM gallery_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;

      db.get(query, [commentId], (err, comment) => {
        if (err) {
          console.error("Database error getting comment by ID:", err);
          reject(err);
          return;
        }
        resolve(comment);
      });
    });
  },

  // Get all gallery comments with pagination
  getAllGalleryComments: (limit = 20, offset = 0) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          gc.*, 
          u.email as user_email, 
          g.title as gallery_title
        FROM gallery_comments gc
        JOIN users u ON gc.user_id = u.id
        JOIN galleries g ON gc.gallery_id = g.id
        ORDER BY gc.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [limit, offset], (err, comments) => {
        if (err) {
          console.error("Database error getting all gallery comments:", err);
          reject(err);
          return;
        }
        resolve(comments || []);
      });
    });
  },

  // Get total count of gallery comments
  getGalleryCommentsCount: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as total FROM gallery_comments
      `;

      db.get(query, [], (err, result) => {
        if (err) {
          console.error("Database error getting comment count:", err);
          reject(err);
          return;
        }
        resolve(result ? result.total : 0);
      });
    });
  },

  // Get comment counts grouped by gallery
  getCommentCountsByGallery: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          g.id as gallery_id, 
          g.name as gallery_name, 
          COUNT(gc.id) as comment_count 
        FROM galleries g
        LEFT JOIN gallery_comments gc ON g.id = gc.gallery_id
        GROUP BY g.id
        ORDER BY comment_count DESC
      `;

      db.all(query, [], (err, results) => {
        if (err) {
          console.error(
            "Database error getting comment counts by gallery:",
            err
          );
          reject(err);
          return;
        }
        resolve(results || []);
      });
    });
  },
};

export default commentModel;
