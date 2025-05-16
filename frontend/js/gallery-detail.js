// Gallery Detail Page JavaScript

// API Base URL
const API_URL = "http://localhost:5000/api";

// Current gallery and image data
let currentGallery = null;
let currentImage = null;
let userRating = 0;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Gallery detail page loaded");

  // Check if user is logged in
  if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
    return;
  }

  // Show admin nav if user is admin
  if (localStorage.getItem("userRole") === "admin") {
    document.getElementById("admin-nav").style.display = "block";
  }

  // Setup logout button
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    window.location.href = "index.html";
  });

  // Get gallery ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const galleryId = urlParams.get("id");

  if (!galleryId) {
    console.log("No gallery ID found in URL");
    window.location.href = "galleries.html";
    return;
  }

  console.log("Loading gallery with ID:", galleryId);

  // Load gallery details
  loadGallery(galleryId);

  // Setup modal close button
  document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("image-modal").style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("image-modal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Setup rating stars
  setupRatingStars();

  // Setup comment submission
  const submitBtn = document.querySelector("#submit-comment");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitComment);
    console.log("Comment button listener attached");
  } else {
    console.error("Submit comment button not found");
  }

  // Setup print button
  document
    .getElementById("print-btn")
    .addEventListener("click", printImageDetails);

  // Add this to your DOMContentLoaded event listener
  document
    .getElementById("print-gallery-btn")
    .addEventListener("click", printGalleryDetails);

  // Load gallery data including ratings
  if (galleryId) {
    loadGalleryRatings(galleryId);
  }

  // Set up integrated feedback button
  const feedbackBtn = document.querySelector("#submit-feedback");
  if (feedbackBtn) {
    feedbackBtn.addEventListener("click", submitFeedback);
    console.log("Feedback button listener attached");
  } else {
    console.error("Submit feedback button not found");
  }

  // Set up rating-only button
  const ratingOnlyBtn = document.querySelector("#submit-rating-only");
  if (ratingOnlyBtn) {
    ratingOnlyBtn.addEventListener("click", () => {
      const selectedStars = document.querySelectorAll(".star-filled");
      const rating = selectedStars.length;
      if (rating > 0) {
        submitRating(rating);
      } else {
        alert("Please select a rating first");
      }
    });
  }

  // Set up comment-only button
  const commentOnlyBtn = document.querySelector("#submit-comment-only");
  if (commentOnlyBtn) {
    commentOnlyBtn.addEventListener("click", submitComment);
  }

  // Load and display comments
  loadAndDisplayComments(galleryId);
});

// Load gallery details
async function loadGallery(galleryId) {
  try {
    console.log("Fetching gallery data...");
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/galleries/${galleryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load gallery");
    }

    const data = await response.json();
    console.log("Gallery data received:", data);

    // Check the structure of the response
    currentGallery = data.gallery || data;

    // Update gallery info
    document.getElementById("gallery-name").textContent = currentGallery.name;
    document.getElementById("gallery-description").textContent =
      currentGallery.description || "No description";

    // Load gallery images
    loadGalleryImages(galleryId);
  } catch (error) {
    console.error("Error loading gallery:", error);
    alert("Error loading gallery: " + error.message);
  }
}

// Load gallery images
async function loadGalleryImages(galleryId) {
  const imagesContainer = document.getElementById("images-container");

  try {
    console.log("Fetching gallery images...");
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/galleries/${galleryId}/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load images");
    }

    const data = await response.json();
    console.log("Gallery images received:", data);

    // Check if images are in an array or in a property
    const images = Array.isArray(data) ? data : data.images || [];

    if (images.length === 0) {
      imagesContainer.innerHTML =
        '<p class="no-images">No images in this gallery</p>';
      return;
    }

    imagesContainer.innerHTML = "";

    images.forEach((image) => {
      const imageElement = document.createElement("div");
      imageElement.className = "image-item";

      // Determine the image URL (adjust based on your API response)
      const imageUrl =
        image.file_path || image.imageUrl || `/uploads/images/${image.id}`;

      imageElement.innerHTML = `
        <img src="${imageUrl}" alt="${image.name}">
        <div class="image-caption">${image.name}</div>
      `;

      imageElement.addEventListener("click", () => openImageModal(image));
      imagesContainer.appendChild(imageElement);
    });
  } catch (error) {
    console.error("Error loading images:", error);
    imagesContainer.innerHTML = `<p class="error-message">Error loading images: ${error.message}</p>`;
  }
}

// Open image modal
async function openImageModal(image) {
  console.log("Opening modal for image:", image);
  currentImage = image;
  userRating = 0;

  // Reset rating stars
  document.querySelectorAll("#rating-stars i").forEach((star) => {
    star.className = "far fa-star";
  });

  // Determine the image URL (adjust based on your API response)
  const imageUrl =
    image.file_path || image.imageUrl || `/uploads/images/${image.id}`;

  // Update modal content
  document.getElementById("modal-image").src = imageUrl;
  document.getElementById("modal-image").alt = image.name;
  document.getElementById("modal-image-name").textContent = image.name;
  document.getElementById("modal-image-description").textContent =
    image.description || "No description";

  // Load comments and ratings
  await loadAndDisplayComments(
    new URLSearchParams(window.location.search).get("id")
  );

  // Show modal
  document.getElementById("image-modal").style.display = "block";
}

// Add this function to load and display comments for a gallery
async function loadAndDisplayComments(galleryId) {
  try {
    console.log(`Loading comments for gallery ${galleryId}`);
    const commentsContainer = document.querySelector(".comments-container");
    const commentsHeading = document.querySelector(".comments-section h3");

    if (!commentsContainer) {
      console.error("Comments container not found");
      return;
    }

    commentsContainer.innerHTML =
      '<p class="loading-comments">Loading comments...</p>';

    // Get token for authenticated request
    const token = localStorage.getItem("token");
    if (!token) {
      commentsContainer.innerHTML =
        '<p class="error">Please login to view comments</p>';
      return;
    }

    // API endpoint
    const API_BASE_URL = "http://localhost:5000/api";

    // Fetch comments from the API
    const response = await fetch(
      `${API_BASE_URL}/galleries/${galleryId}/comments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load comments: ${response.status} ${response.statusText}`
      );
    }

    const comments = await response.json();
    console.log(
      `Received ${comments.length} comments for gallery ${galleryId}`,
      comments
    );

    // Update comments count in heading
    if (commentsHeading) {
      commentsHeading.textContent = `Comments (${comments.length})`;
    }

    // Display comments or show a message if there are none
    if (comments.length === 0) {
      commentsContainer.innerHTML =
        '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    } else {
      commentsContainer.innerHTML = "";

      // Sort comments by date (newest first)
      comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Create element for each comment
      comments.forEach((comment) => {
        const commentEl = document.createElement("div");
        commentEl.className = "comment";

        // Format date nicely
        const commentDate = new Date(comment.created_at);
        const formattedDate = commentDate.toLocaleString();

        commentEl.innerHTML = `
          <div class="comment-header">
            <span class="comment-author">${
              comment.user_email || "Anonymous"
            }</span>
            <span class="comment-date">${formattedDate}</span>
          </div>
          <div class="comment-text">${comment.comment}</div>
        `;

        commentsContainer.appendChild(commentEl);
      });
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    const commentsContainer = document.querySelector(".comments-container");
    if (commentsContainer) {
      commentsContainer.innerHTML = `<p class="error">Error loading comments: ${error.message}</p>`;
    }
  }
}

// Generate star rating HTML
function getStarRating(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fas fa-star"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  return stars;
}

// Update average stars display
function updateAverageStars(rating) {
  const starsContainer = document.getElementById("average-stars");
  starsContainer.innerHTML = getStarRating(Math.round(rating));
}

// Modified setupRatingStars function with more debugging
function setupRatingStars() {
  console.log("Setting up rating stars");
  const stars = document.querySelectorAll(".star");

  if (stars.length === 0) {
    console.error("No star elements found! Check your HTML");
    return;
  }

  console.log(`Found ${stars.length} star elements`);

  // Add hover effect
  stars.forEach((star, index) => {
    console.log(
      `Setting up star ${index + 1} with rating ${star.dataset.rating}`
    );

    star.addEventListener("mouseover", () => {
      const rating = parseInt(star.dataset.rating);
      console.log(`Hovering over star with rating ${rating}`);

      // Add hover class to this star and all previous stars
      stars.forEach((s, i) => {
        if (i < rating) {
          s.classList.add("star-hover");
        } else {
          s.classList.remove("star-hover");
        }
      });
    });

    // Handle click to submit rating
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.rating);
      console.log(`Star ${rating} clicked`);
      submitRating(rating);
    });
  });

  // Remove hover effect when mouse leaves the rating container
  const starContainer = document.querySelector(".star-rating");
  if (starContainer) {
    starContainer.addEventListener("mouseleave", () => {
      console.log("Mouse left star container");
      stars.forEach((s) => s.classList.remove("star-hover"));
    });
  } else {
    console.error("Star container not found!");
  }
}

// Reset to original port
async function submitComment() {
  const commentText = document.querySelector("textarea").value.trim();
  const galleryId = new URLSearchParams(window.location.search).get("id");

  if (!commentText) {
    alert("Please enter a comment");
    return;
  }

  try {
    console.log(
      `Submitting comment for gallery ${galleryId}: "${commentText}"`
    );

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    // Use original port
    const API_BASE_URL = "http://localhost:5000/api";

    console.log(
      "Sending request to:",
      `${API_BASE_URL}/galleries/${galleryId}/comments`
    );
    console.log("With token:", token.substring(0, 10) + "...");

    const response = await fetch(
      `${API_BASE_URL}/galleries/${galleryId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: commentText,
        }),
      }
    );

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit comment");
    }

    // Clear the comment text
    document.querySelector("textarea").value = "";

    // Show success message
    alert("Comment submitted successfully");
  } catch (error) {
    console.error("Error submitting comment:", error);
    alert("Error submitting comment: " + error.message);
  }
}

// Submit a rating
async function submitRating(ratingValue) {
  const galleryId = new URLSearchParams(window.location.search).get("id");

  try {
    console.log(`Submitting rating ${ratingValue} for gallery ${galleryId}`);

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    const API_BASE_URL = "http://localhost:5000/api";

    console.log(
      "Sending rating request to:",
      `${API_BASE_URL}/galleries/${galleryId}/ratings`
    );

    const response = await fetch(
      `${API_BASE_URL}/galleries/${galleryId}/ratings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: ratingValue,
        }),
      }
    );

    console.log("Rating response status:", response.status);

    const data = await response.json();
    console.log("Rating response data:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit rating");
    }

    // Update UI to show the new rating
    document.getElementById(
      "user-rating"
    ).textContent = `Your Rating: ${ratingValue}/5`;
    document.getElementById(
      "average-rating"
    ).textContent = `Average Rating: ${data.averageRating}/5`;

    // Update star display
    updateStarDisplay(ratingValue);

    // Show success message
    alert("Rating submitted successfully");
  } catch (error) {
    console.error("Error submitting rating:", error);
    alert("Error submitting rating: " + error.message);
  }
}

// Function to update star display based on rating
function updateStarDisplay(rating) {
  const stars = document.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("star-filled");
    } else {
      star.classList.remove("star-filled");
    }
  });
}

// Load gallery ratings
async function loadGalleryRatings(galleryId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const API_BASE_URL = "http://localhost:5000/api";

    // Fetch ratings
    const ratingsResponse = await fetch(
      `${API_BASE_URL}/galleries/${galleryId}/ratings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!ratingsResponse.ok) {
      throw new Error("Failed to load ratings");
    }

    const ratingsData = await ratingsResponse.json();
    console.log("Gallery ratings data:", ratingsData);

    // Update average rating display
    document.getElementById("average-rating").textContent = `Average Rating: ${
      ratingsData.averageRating
    }/5 (${ratingsData.totalRatings} ${
      ratingsData.totalRatings === 1 ? "rating" : "ratings"
    })`;

    // Fetch current user's rating (if authenticated)
    const userRating = ratingsData.ratings.find(
      (r) => r.user_id === parseInt(localStorage.getItem("userId"))
    );
    if (userRating) {
      document.getElementById(
        "user-rating"
      ).textContent = `Your Rating: ${userRating.rating}/5`;
      updateStarDisplay(userRating.rating);
    }
  } catch (error) {
    console.error("Error loading ratings:", error);
  }
}

// Print image details and comments to PDF
function printImageDetails() {
  if (!currentImage) {
    console.error("No image selected");
    return;
  }

  console.log("Generating PDF for image:", currentImage);

  // Create content for PDF
  const content = document.createElement("div");
  content.className = "print-content";
  content.style.padding = "20px";
  content.style.fontFamily = "Arial, sans-serif";

  // Determine the image URL
  const imageUrl =
    currentImage.file_path ||
    currentImage.imageUrl ||
    `/uploads/images/${currentImage.id}`;

  // Add image details
  content.innerHTML = `
    <h1 style="text-align: center; color: #333;">${currentImage.name}</h1>
    <div style="text-align: center; margin: 20px 0;">
      <img src="${imageUrl}" alt="${
    currentImage.name
  }" style="max-width: 90%; max-height: 300px; border: 1px solid #ddd; border-radius: 4px; padding: 5px;">
    </div>
    <div style="margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #555;">Description</h3>
      <p>${currentImage.description || "No description available"}</p>
    </div>
    <div style="margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #555;">Rating Information</h3>
      <p><strong>Average Rating:</strong> ${
        document.getElementById("average-rating").textContent
      }/5</p>
      <div style="color: #f39c12;">
        ${getStarRating(
          parseFloat(document.getElementById("average-rating").textContent)
        )}
      </div>
    </div>
    <h2 style="margin-top: 30px; padding-bottom: 5px; border-bottom: 2px solid #eee; color: #333;">Comments</h2>
  `;

  // Add comments
  const comments = document.querySelectorAll(".comment-item");
  const commentsContainer = document.createElement("div");

  if (comments.length === 0) {
    commentsContainer.innerHTML =
      '<p style="font-style: italic; color: #777;">No comments yet.</p>';
  } else {
    comments.forEach((comment) => {
      const commentClone = comment.cloneNode(true);

      // Style the cloned comment for PDF
      commentClone.style.margin = "15px 0";
      commentClone.style.padding = "10px";
      commentClone.style.backgroundColor = "#f9f9f9";
      commentClone.style.borderRadius = "4px";

      commentsContainer.appendChild(commentClone);
    });
  }

  content.appendChild(commentsContainer);

  // Add footer with date
  const footer = document.createElement("div");
  footer.style.marginTop = "30px";
  footer.style.borderTop = "1px solid #eee";
  footer.style.paddingTop = "10px";
  footer.style.fontSize = "12px";
  footer.style.color = "#777";
  footer.style.textAlign = "center";

  const currentDate = new Date();
  footer.textContent = `Generated on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;

  content.appendChild(footer);

  // Generate PDF
  const opt = {
    margin: 1,
    filename: `${currentImage.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_details.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
  };

  // Use html2pdf library to generate PDF
  html2pdf().set(opt).from(content).save();
}

// Print entire gallery details to PDF
function printGalleryDetails() {
  if (!currentGallery) {
    console.error("No gallery loaded");
    return;
  }

  console.log("Generating PDF for gallery:", currentGallery);

  // Create content for PDF
  const content = document.createElement("div");
  content.className = "print-content";
  content.style.padding = "20px";
  content.style.fontFamily = "Arial, sans-serif";

  // Add gallery details
  content.innerHTML = `
    <h1 style="text-align: center; color: #333;">${currentGallery.name}</h1>
    <div style="margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #555;">Description</h3>
      <p>${currentGallery.description || "No description available"}</p>
    </div>
    <h2 style="margin-top: 30px; padding-bottom: 5px; border-bottom: 2px solid #eee; color: #333;">Images</h2>
  `;

  // Add images
  const imagesContainer = document.createElement("div");
  imagesContainer.style.display = "flex";
  imagesContainer.style.flexWrap = "wrap";
  imagesContainer.style.justifyContent = "center";
  imagesContainer.style.gap = "15px";
  imagesContainer.style.margin = "20px 0";

  const imageItems = document.querySelectorAll(".image-item");

  if (imageItems.length === 0) {
    imagesContainer.innerHTML =
      '<p style="font-style: italic; color: #777;">No images in this gallery.</p>';
  } else {
    imageItems.forEach((imageItem) => {
      const imageContainer = document.createElement("div");
      imageContainer.style.width = "45%";
      imageContainer.style.margin = "10px";
      imageContainer.style.textAlign = "center";

      const img = imageItem.querySelector("img");
      const caption = imageItem.querySelector(".image-caption");

      imageContainer.innerHTML = `
        <img src="${img.src}" alt="${
        img.alt
      }" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;">
        <p style="margin-top: 5px; font-weight: bold;">${
          caption ? caption.textContent : "Image"
        }</p>
      `;

      imagesContainer.appendChild(imageContainer);
    });
  }

  content.appendChild(imagesContainer);

  // Add footer with date
  const footer = document.createElement("div");
  footer.style.marginTop = "30px";
  footer.style.borderTop = "1px solid #eee";
  footer.style.paddingTop = "10px";
  footer.style.fontSize = "12px";
  footer.style.color = "#777";
  footer.style.textAlign = "center";

  const currentDate = new Date();
  footer.textContent = `Generated on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;

  content.appendChild(footer);

  // Generate PDF
  const opt = {
    margin: 1,
    filename: `${currentGallery.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_gallery.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
  };

  // Use html2pdf library to generate PDF
  html2pdf().set(opt).from(content).save();
}

// Helper function to show messages
function showMessage(message, type = "info") {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) {
    // Create messages container if it doesn't exist
    const main = document.querySelector("main");
    const newContainer = document.createElement("div");
    newContainer.id = "messages";
    main.insertBefore(newContainer, main.firstChild);
  }

  const messageElement = document.createElement("div");
  messageElement.className = `message ${type}`;
  messageElement.textContent = message;

  document.getElementById("messages").appendChild(messageElement);

  // Remove message after 5 seconds
  setTimeout(() => {
    messageElement.remove();
  }, 5000);
}

// Helper function to get gallery ID from URL
function getGalleryIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Update the submitFeedback function to refresh comments after submission
async function submitFeedback() {
  const commentText = document.querySelector("#comment-text").value.trim();
  const galleryId = new URLSearchParams(window.location.search).get("id");

  // Get the currently selected rating
  const selectedStars = document.querySelectorAll(".star-filled");
  const rating = selectedStars.length;

  // Validate that at least one is provided
  if (rating === 0 && !commentText) {
    alert("Please provide a rating, comment, or both");
    return;
  }

  try {
    console.log(
      `Submitting feedback for gallery ${galleryId}: Rating=${rating}, Comment="${commentText}"`
    );

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    const API_BASE_URL = "http://localhost:5000/api";

    // Construct the request body based on what was provided
    const requestBody = {};
    if (rating > 0) requestBody.rating = rating;
    if (commentText) requestBody.comment = commentText;

    // Always use the ratings endpoint when both are provided
    const endpoint = `${API_BASE_URL}/galleries/${galleryId}/ratings`;

    console.log(`Sending request to: ${endpoint}`);
    console.log(`Request body:`, requestBody);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit feedback");
    }

    // Update UI based on what was submitted
    if (rating > 0) {
      document.getElementById(
        "user-rating"
      ).textContent = `Your Rating: ${rating}/5`;
      if (data.averageRating) {
        document.getElementById(
          "average-rating"
        ).textContent = `Average Rating: ${data.averageRating}/5`;
      }
    }

    // Clear the comment text
    document.querySelector("#comment-text").value = "";

    // Show success message
    alert("Your feedback was submitted successfully!");

    // Reload both ratings and comments to refresh the UI
    loadGalleryRatings(galleryId);
    loadAndDisplayComments(galleryId);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert("Error submitting feedback: " + error.message);
  }
}
