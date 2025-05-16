// Initialize image page
document.addEventListener("DOMContentLoaded", () => {
  const isGalleryDetailPage = window.location.pathname.includes(
    "gallery-detail.html"
  );

  if (isGalleryDetailPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const galleryId = urlParams.get("id");

    if (galleryId) {
      loadGalleryDetail(galleryId);
      setupImageModal();
    } else {
      alert("Gallery ID is missing. Redirecting to gallery list.");
      window.location.href = "galleries.html";
    }
  }
});

// Load gallery details and images
async function loadGalleryDetail(galleryId) {
  const galleryNameEl = document.getElementById("gallery-name");
  const galleryDescriptionEl = document.getElementById("gallery-description");
  const imagesContainer = document.getElementById("images-container");

  try {
    imagesContainer.innerHTML = '<div class="loading">Loading images...</div>';

    // Get gallery details
    const gallery = await fetchAPI(`/galleries/${galleryId}`);
    galleryNameEl.textContent = gallery.name;
    galleryDescriptionEl.textContent = gallery.description || "No description";

    // Get gallery images
    const images = await fetchAPI(`/galleries/${galleryId}/images`);

    if (images.length === 0) {
      imagesContainer.innerHTML =
        '<div class="placeholder">No images in this gallery</div>';
      return;
    }

    imagesContainer.innerHTML = "";
    images.forEach((image) => {
      imagesContainer.appendChild(createImageCard(image));
    });
  } catch (error) {
    imagesContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
}

// Create an image card
function createImageCard(image) {
  const card = document.createElement("div");
  card.classList.add("image-card");
  card.dataset.id = image.id;
  card.dataset.name = image.name;
  card.dataset.description = image.description || "";
  card.dataset.imageUrl = image.imageUrl;

  card.innerHTML = `
        <div class="image-thumbnail">
            <img src="${image.imageUrl}" alt="${image.name}">
        </div>
        <div class="image-info">
            <h3>${image.name}</h3>
            <div class="rating-summary">
                <div class="stars">
                    <span class="star-rating">${image.rating || 0}</span>
                    <div class="star-display">${getStarDisplay(
                      image.rating || 0
                    )}</div>
                </div>
                <span>${image.commentCount || 0} comments</span>
            </div>
        </div>
    `;

  card.addEventListener("click", () => openImageModal(image));

  return card;
}

// Generate star display based on rating
function getStarDisplay(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "";
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars += "★";
  }
  // Half star
  if (halfStar) {
    stars += "⯨";
  }
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += "☆";
  }

  return stars;
}

// Setup the image modal
function setupImageModal() {
  const modal = document.getElementById("image-modal");
  const closeBtn = modal.querySelector(".close-btn");

  // Close modal when clicking the X button
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside the content
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Setup comment submission
  const commentForm = document.getElementById("submit-comment");
  if (commentForm) {
    commentForm.addEventListener("click", submitComment);
  }

  // Setup star rating
  const stars = document.querySelectorAll("#rating-stars .star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const value = parseInt(star.dataset.value);

      // Update visual state
      stars.forEach((s) => {
        if (parseInt(s.dataset.value) <= value) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });

      // Store selected rating
      commentForm.dataset.rating = value;
    });
  });
}

// Open image modal with details
async function openImageModal(image) {
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const modalName = document.getElementById("modal-image-name");
  const modalDescription = document.getElementById("modal-image-description");
  const modalAvgRating = document.getElementById("modal-avg-rating");
  const avgStars = document.getElementById("avg-stars");
  const commentCount = document.getElementById("comment-count");
  const commentsContainer = document.getElementById("comments-container");

  // Reset the comment form
  document.getElementById("comment-text").value = "";
  document.querySelectorAll("#rating-stars .star").forEach((star) => {
    star.classList.remove("active");
  });

  // Set image details
  modalImage.src = image.imageUrl;
  modalImage.alt = image.name;
  modalName.textContent = image.name;
  modalDescription.textContent = image.description || "No description";
  modalAvgRating.textContent = image.rating || "0.0";
  avgStars.innerHTML = getStarDisplay(image.rating || 0);
  commentCount.textContent = `${image.commentCount || 0} comments`;

  // Store image ID for comment submission
  document.getElementById("submit-comment").dataset.imageId = image.id;

  // Load comments
  commentsContainer.innerHTML =
    '<div class="loading">Loading comments...</div>';

  try {
    const comments = await fetchAPI(`/images/${image.id}/comments`);

    if (comments.length === 0) {
      commentsContainer.innerHTML =
        '<div class="placeholder">No comments yet</div>';
    } else {
      commentsContainer.innerHTML = "";
      comments.forEach((comment) => {
        const commentEl = document.createElement("div");
        commentEl.classList.add("comment-item");
        commentEl.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-user">${
                          comment.userEmail || "Anonymous"
                        }</span>
                        <span class="comment-rating">${getStarDisplay(
                          comment.rating
                        )} (${comment.rating})</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-date">${new Date(
                      comment.createdAt
                    ).toLocaleDateString()}</div>
                `;
        commentsContainer.appendChild(commentEl);
      });
    }

    // Show the modal
    modal.style.display = "block";
  } catch (error) {
    commentsContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    // Still show the modal with error message
    modal.style.display = "block";
  }
}

// Submit a new comment
async function submitComment() {
  const imageId = this.dataset.imageId;
  const rating = parseInt(this.dataset.rating || "0");
  const text = document.getElementById("comment-text").value.trim();

  if (!rating) {
    alert("Please select a rating");
    return;
  }

  if (!text) {
    alert("Please enter a comment");
    return;
  }

  try {
    await fetchAPI(`/images/${imageId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        rating,
        text,
      }),
    });

    // Reload the image modal to show the new comment
    const imageCard = document.querySelector(
      `.image-card[data-id="${imageId}"]`
    );
    if (imageCard) {
      const image = {
        id: imageId,
        name: imageCard.dataset.name,
        description: imageCard.dataset.description,
        imageUrl: imageCard.dataset.imageUrl,
      };
      openImageModal(image);
    } else {
      // Fallback: just close the modal and refresh
      document.getElementById("image-modal").style.display = "none";
      window.location.reload();
    }
  } catch (error) {
    alert(`Error submitting comment: ${error.message}`);
  }
}
