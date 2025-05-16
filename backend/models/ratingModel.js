import db from "../db/database.js";

const ratingModel = {
  // Add a rating
  addRating: (galleryId, userId, rating) => {
    return new Promise((resolve, reject) => {
      // First check if user already rated this gallery
      db.get(
        "SELECT id FROM ratings WHERE gallery_id = ? AND user_id = ?",
        [galleryId, userId],
        (err, existingRating) => {
          if (err) {
            console.error("Database error checking existing rating:", err);
            reject(err);
            return;
          }

          if (existingRating) {
            // Update existing rating
            db.run(
              "UPDATE ratings SET rating = ? WHERE id = ?",
              [rating, existingRating.id],
              function (err) {
                if (err) {
                  console.error("Database error updating rating:", err);
                  reject(err);
                  return;
                }
                resolve({ id: existingRating.id, rating, updated: true });
              }
            );
          } else {
            // Insert new rating
            db.run(
              "INSERT INTO ratings (gallery_id, user_id, rating) VALUES (?, ?, ?)",
              [galleryId, userId, rating],
              function (err) {
                if (err) {
                  console.error("Database error adding rating:", err);
                  reject(err);
                  return;
                }
                resolve({ id: this.lastID, rating, updated: false });
              }
            );
          }
        }
      );
    });
  },

  // Get all ratings for a gallery
  getGalleryRatings: (galleryId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT r.*, u.email as user_email
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.gallery_id = ?
        ORDER BY r.created_at DESC
      `;

      db.all(query, [galleryId], (err, ratings) => {
        if (err) {
          console.error("Database error getting ratings:", err);
          reject(err);
          return;
        }
        resolve(ratings || []);
      });
    });
  },

  // Get rating statistics for a gallery
  getGalleryRatingStats: (galleryId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalRatings,
          ROUND(AVG(rating), 1) as averageRating
        FROM ratings
        WHERE gallery_id = ?
      `;

      db.get(query, [galleryId], (err, stats) => {
        if (err) {
          console.error("Database error getting rating stats:", err);
          reject(err);
          return;
        }

        // Ensure we have valid values even if no ratings exist
        resolve({
          totalRatings: parseInt(stats.totalRatings) || 0,
          averageRating: stats.averageRating || "0.0",
        });
      });
    });
  },

  // Get a user's rating for a gallery
  getUserRating: (galleryId, userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM ratings WHERE gallery_id = ? AND user_id = ?",
        [galleryId, userId],
        (err, rating) => {
          if (err) {
            console.error("Database error getting user rating:", err);
            reject(err);
            return;
          }
          resolve(rating);
        }
      );
    });
  },

  // Get rating summaries for all galleries
  getRatingSummaries: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          g.id as gallery_id, 
          g.name as gallery_title, 
          COUNT(r.id) as rating_count,
          ROUND(AVG(r.rating), 1) as average_rating
        FROM galleries g
        LEFT JOIN ratings r ON g.id = r.gallery_id
        GROUP BY g.id
        ORDER BY rating_count DESC
      `;

      db.all(query, [], (err, results) => {
        if (err) {
          console.error("Database error getting rating summaries:", err);
          reject(err);
          return;
        }

        // Format results
        const summaries = results.map((row) => ({
          gallery_id: row.gallery_id,
          gallery_title: row.gallery_title,
          rating_count: row.rating_count || 0,
          average_rating: row.average_rating || "0.0",
        }));

        resolve(summaries);
      });
    });
  },
};

export default ratingModel;
