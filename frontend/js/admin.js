// Define API base URL
const API_URL = "http://localhost:5000/api";

// Function to get token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Check if user is logged in as admin
document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (!token) {
    // Redirect to login page if not logged in
    window.location.href = "/index.html";
    return;
  }

  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") {
    // Redirect to home page if not admin
    window.location.href = "/galleries.html";
    alert("You do not have permission to access the admin area");
    return;
  }

  // Setup logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      window.location.href = "/index.html";
    });
  }

  // Load galleries
  loadGalleries();

  // Add event listeners
  // setupEventListeners();
});

// Function to load galleries
async function loadGalleries() {
  try {
    const response = await fetch(`${API_URL}/galleries`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch galleries");
    }

    const data = await response.json();
    displayGalleries(data.galleries || []);
  } catch (error) {
    console.error("Error loading galleries:", error);
    document.getElementById("galleries-container").innerHTML = `
            <div class="error-message">
                <p>Error loading galleries: ${error.message}</p>
            </div>
        `;
  }
}

// Initialize admin page
document.addEventListener("DOMContentLoaded", () => {
  const isAdminPage = window.location.pathname.includes("admin.html");

  if (isAdminPage) {
    // Check if user is admin
    if (!isAdmin()) {
      alert("You do not have permission to access the admin area.");
      window.location.href = "galleries.html";
      return;
    }

    setupAdminNav();
    loadGalleriesList();
    setupGalleryForm();
    setupImageForm();
    loadGallerySelect();
    loadUsersSection();
  }
});

// Setup admin navigation
function setupAdminNav() {
  const navButtons = document.querySelectorAll(".admin-nav-btn");
  const sections = document.querySelectorAll(".admin-section");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active nav button
      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show corresponding section
      sections.forEach((section) => (section.style.display = "none"));

      if (button.id === "manage-galleries-btn") {
        document.getElementById("galleries-section").style.display = "block";
      } else if (button.id === "manage-images-btn") {
        document.getElementById("images-section").style.display = "block";
      } else if (button.id === "manage-users-btn") {
        document.getElementById("users-section").style.display = "block";
      }
    });
  });
}

// Load galleries for the admin list
async function loadGalleriesList() {
  const galleriesList = document.getElementById("galleries-list");

  try {
    galleriesList.innerHTML = '<div class="loading">Loading galleries...</div>';
    const galleries = await fetchAPI("/galleries");

    if (galleries.length === 0) {
      galleriesList.innerHTML =
        '<div class="placeholder">No galleries yet</div>';
      return;
    }

    galleriesList.innerHTML = "";
    galleries.forEach((gallery) => {
      const galleryItem = document.createElement("div");
      galleryItem.classList.add("list-item");
      galleryItem.innerHTML = `
                <div class="item-details">
                    <h3>${gallery.name}</h3>
                    <p>${gallery.description || "No description"}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" data-id="${
                      gallery.id
                    }">Edit</button>
                    <button class="btn-delete" data-id="${
                      gallery.id
                    }">Delete</button>
                </div>
            `;

      galleriesList.appendChild(galleryItem);
    });

    // Add event listeners to edit and delete buttons
    galleriesList.querySelectorAll(".btn-edit").forEach((button) => {
      button.addEventListener("click", () => editGallery(button.dataset.id));
    });

    galleriesList.querySelectorAll(".btn-delete").forEach((button) => {
      button.addEventListener("click", () => deleteGallery(button.dataset.id));
    });
  } catch (error) {
    galleriesList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
}

// Setup gallery form
function setupGalleryForm() {
  const addGalleryBtn = document.getElementById("add-gallery-btn");
  const galleryFormContainer = document.getElementById(
    "gallery-form-container"
  );
  const closeGalleryForm = document.getElementById("close-gallery-form");
  const galleryForm = document.getElementById("gallery-form");

  // Open form for new gallery
  addGalleryBtn.addEventListener("click", () => {
    document.getElementById("gallery-form-title").textContent =
      "Add New Gallery";
    document.getElementById("gallery-id").value = "";
    document.getElementById("gallery-name-input").value = "";
    document.getElementById("gallery-description-input").value = "";
    document.getElementById("gallery-thumbnail-input").value = "";
    document.getElementById("gallery-thumbnail-preview").innerHTML = "";
    galleryFormContainer.style.display = "block";
  });

  // Close the form
  closeGalleryForm.addEventListener("click", () => {
    galleryFormContainer.style.display = "none";
  });

  // Submit gallery form
  // galleryForm.addEventListener("submit", handleGalleryFormSubmit);
}

// Function to handle gallery form submission
async function handleGalleryFormSubmit(event) {
  event.preventDefault();
  const galleryId = document.getElementById("gallery-id").value;
  const name = document.getElementById("gallery-name-input").value;
  const description = document.getElementById(
    "gallery-description-input"
  ).value;
  const thumbnailInput = document.getElementById("gallery-thumbnail-input");

  try {
    // Create FormData object for file upload
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    // Add file if selected
    if (thumbnailInput.files && thumbnailInput.files[0]) {
      formData.append("thumbnail", thumbnailInput.files[0]);
      console.log("Adding thumbnail file:", thumbnailInput.files[0].name);
    }

    const url = galleryId
      ? `${API_URL}/galleries/${galleryId}`
      : `${API_URL}/galleries`;

    const method = galleryId ? "PUT" : "POST";

    console.log(`Submitting gallery to ${url} with method ${method}`);

    // IMPORTANT: Don't set Content-Type header when sending FormData
    // The browser will set it automatically with the correct boundary
    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          `Failed to ${galleryId ? "update" : "create"} gallery`
      );
    }

    // Close form and refresh galleries
    document.getElementById("gallery-form-container").style.display = "none";
    loadGalleries();
  } catch (error) {
    console.error("Error submitting gallery:", error);
    alert(`Error: ${error.message}`);
  }
}

// Edit gallery
async function editGallery(galleryId) {
  try {
    const gallery = await fetchAPI(`/galleries/${galleryId}`);

    document.getElementById("gallery-form-title").textContent = "Edit Gallery";
    document.getElementById("gallery-id").value = gallery.id;
    document.getElementById("gallery-name-input").value = gallery.name;
    document.getElementById("gallery-description-input").value =
      gallery.description || "";
    document.getElementById("gallery-thumbnail-input").value = "";
    document.getElementById("gallery-thumbnail-preview").innerHTML = "";

    // Show current thumbnail if exists
    if (gallery.thumbnail_url) {
      const imgPreview = document.createElement("img");
      imgPreview.src = gallery.thumbnail_url;
      imgPreview.alt = gallery.name;
      imgPreview.style.maxWidth = "200px";
      imgPreview.style.maxHeight = "150px";
      document
        .getElementById("gallery-thumbnail-preview")
        .appendChild(imgPreview);
    }

    document.getElementById("gallery-form-container").style.display = "block";
  } catch (error) {
    alert(`Error loading gallery: ${error.message}`);
  }
}

// Delete gallery
async function deleteGallery(galleryId) {
  if (
    !confirm(
      "Are you sure you want to delete this gallery? This will also delete all images and comments."
    )
  ) {
    return;
  }

  try {
    await fetchAPI(`/galleries/${galleryId}`, {
      method: "DELETE",
    });

    loadGalleriesList();
    loadGallerySelect();
  } catch (error) {
    alert(`Error deleting gallery: ${error.message}`);
  }
}

// Load galleries for the select dropdown
async function loadGallerySelect() {
  const gallerySelect = document.getElementById("gallery-select");
  const accessGallerySelect = document.getElementById("access-gallery-select");

  try {
    // Use the existing API_BASE_URL from your code
    const API_BASE_URL = "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    // Fetch galleries from the admin endpoint we created
    const response = await fetch(`${API_BASE_URL}/admin/available-galleries`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch galleries");
    }

    const data = await response.json();
    const galleries = data.galleries || [];

    console.log("Galleries loaded for dropdown:", galleries);

    [gallerySelect, accessGallerySelect].forEach((select) => {
      if (!select) return;

      // Clear all options except the first one
      while (select.options.length > 1) {
        select.remove(1);
      }

      // Add gallery options
      galleries.forEach((gallery) => {
        const option = document.createElement("option");
        option.value = gallery.id;
        option.textContent = gallery.name;
        select.appendChild(option);
      });

      console.log(`Populated ${select.id} with ${galleries.length} galleries`);
    });
  } catch (error) {
    console.error("Error loading galleries for dropdown:", error);
  }
}

// Setup image section
document.addEventListener("DOMContentLoaded", () => {
  const gallerySelect = document.getElementById("gallery-select");
  const addImageBtn = document.getElementById("add-image-btn");

  if (gallerySelect) {
    gallerySelect.addEventListener("change", () => {
      const galleryId = gallerySelect.value;

      if (galleryId) {
        loadImagesForGallery(galleryId);
        addImageBtn.disabled = false;
      } else {
        document.getElementById("images-list").innerHTML =
          '<div class="placeholder">Select a gallery to manage images</div>';
        addImageBtn.disabled = true;
      }
    });
  }
});

// Load images for selected gallery
async function loadImagesForGallery(galleryId) {
  const imagesList = document.getElementById("images-list");

  try {
    imagesList.innerHTML = '<div class="loading">Loading images...</div>';
    const images = await fetchAPI(`/galleries/${galleryId}/images`);

    if (images.length === 0) {
      imagesList.innerHTML =
        '<div class="placeholder">No images in this gallery</div>';
      return;
    }

    imagesList.innerHTML = "";
    images.forEach((image) => {
      const imageItem = document.createElement("div");
      imageItem.classList.add("list-item");
      imageItem.innerHTML = `
                <div class="item-details">
                    <div class="item-thumbnail">
                        <img src="${image.imageUrl}" alt="${image.name}">
                    </div>
                    <div>
                        <h3>${image.name}</h3>
                        <p>${image.description || "No description"}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" data-id="${image.id}">Edit</button>
                    <button class="btn-delete" data-id="${
                      image.id
                    }">Delete</button>
                </div>
            `;

      imagesList.appendChild(imageItem);
    });

    // Add event listeners to edit and delete buttons
    imagesList.querySelectorAll(".btn-edit").forEach((button) => {
      button.addEventListener("click", () => editImage(button.dataset.id));
    });

    imagesList.querySelectorAll(".btn-delete").forEach((button) => {
      button.addEventListener("click", () => deleteImage(button.dataset.id));
    });
  } catch (error) {
    imagesList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
}

// Setup image form
function setupImageForm() {
  const addImageBtn = document.getElementById("add-image-btn");
  const imageFormContainer = document.getElementById("image-form-container");
  const closeImageForm = document.getElementById("close-image-form");
  const imageForm = document.getElementById("image-form");

  // Open form for new image
  addImageBtn.addEventListener("click", () => {
    const galleryId = document.getElementById("gallery-select").value;

    document.getElementById("image-form-title").textContent = "Add New Image";
    document.getElementById("image-id").value = "";
    document.getElementById("image-gallery-id").value = galleryId;
    document.getElementById("image-name-input").value = "";
    document.getElementById("image-description-input").value = "";
    document.getElementById("image-file-input").value = "";
    document.getElementById("current-image-preview").innerHTML = "";

    imageFormContainer.style.display = "block";
  });

  // Close the form
  closeImageForm.addEventListener("click", () => {
    imageFormContainer.style.display = "none";
  });

  // Submit image form
  imageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const imageId = document.getElementById("image-id").value;
    const galleryId = document.getElementById("image-gallery-id").value;
    const name = document.getElementById("image-name-input").value;
    const description = document.getElementById(
      "image-description-input"
    ).value;
    const fileInput = document.getElementById("image-file-input");

    // Create a FormData object to send file
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    if (fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    try {
      if (imageId) {
        // Update existing image
        await fetch(`${API_URL}/images/${imageId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
      } else {
        // Create new image
        await fetch(`${API_URL}/galleries/${galleryId}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
      }

      imageFormContainer.style.display = "none";
      loadImagesForGallery(galleryId);
    } catch (error) {
      alert(`Error saving image: ${error.message}`);
    }
  });
}

// Edit image
async function editImage(imageId) {
  try {
    const image = await fetchAPI(`/images/${imageId}`);

    document.getElementById("image-form-title").textContent = "Edit Image";
    document.getElementById("image-id").value = image.id;
    document.getElementById("image-gallery-id").value = image.galleryId;
    document.getElementById("image-name-input").value = image.name;
    document.getElementById("image-description-input").value =
      image.description || "";

    // Display current image
    const preview = document.getElementById("current-image-preview");
    preview.innerHTML = `
            <p>Current image:</p>
            <img src="${image.imageUrl}" alt="${image.name}">
            <p class="current-file">Leave file input empty to keep the current image</p>
        `;

    document.getElementById("image-form-container").style.display = "block";
  } catch (error) {
    alert(`Error loading image: ${error.message}`);
  }
}

// Delete image
async function deleteImage(imageId) {
  if (
    !confirm(
      "Are you sure you want to delete this image? This will also delete all comments."
    )
  ) {
    return;
  }

  try {
    await fetchAPI(`/images/${imageId}`, {
      method: "DELETE",
    });

    const galleryId = document.getElementById("gallery-select").value;
    loadImagesForGallery(galleryId);
  } catch (error) {
    alert(`Error deleting image: ${error.message}`);
  }
}

// Load users section
async function loadUsersSection() {
  const usersList = document.getElementById("users-list");

  // Setup gallery access dropdown
  const accessGallerySelect = document.getElementById("access-gallery-select");
  if (accessGallerySelect) {
    accessGallerySelect.addEventListener("change", () => {
      const galleryId = accessGallerySelect.value;

      if (galleryId) {
        loadGalleryUsers(galleryId);
      } else {
        document.getElementById("gallery-users").innerHTML =
          '<div class="placeholder">Select a gallery to manage access</div>';
      }
    });
  }

  try {
    usersList.innerHTML = '<div class="loading">Loading users...</div>';
    const response = await fetch("http://localhost:5000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load users");
    const data = await response.json();

    if (data.users && data.users.length > 0) {
      usersList.innerHTML = "";

      data.users.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.innerHTML = `
          <div class="user-info">
            <span class="user-email">${user.email}</span>
            <span class="user-role">${user.role}</span>
          </div>
          <div class="user-actions">
            ${
              user.role !== "admin"
                ? `<button class="btn-edit" data-id="${user.id}">Edit</button>
               <button class="btn-delete" data-id="${user.id}">Delete</button>`
                : "<span>Admin user</span>"
            }
          </div>
        `;
        usersList.appendChild(userItem);
      });

      // Add event listeners to the edit and delete buttons
      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", (e) => {
          const userId = e.target.getAttribute("data-id");
          editUser(userId);
        });
      });

      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", (e) => {
          const userId = e.target.getAttribute("data-id");
          deleteUser(userId);
        });
      });
    } else {
      usersList.innerHTML = '<div class="placeholder">No users found</div>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = `<div class="error-message">Error loading users: ${error.message}</div>`;
  }
}

// Load users with access to a gallery
async function loadGalleryUsers(galleryId) {
  const galleryUsersSection = document.querySelector(
    "#gallery-users, .gallery-users-section"
  );
  if (!galleryUsersSection) return;

  try {
    galleryUsersSection.innerHTML = "<p>Loading users...</p>";

    const API_BASE_URL = "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/admin/gallery-access/${galleryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users with gallery access");
    }

    const data = await response.json();
    const users = data.users || [];

    if (users.length === 0) {
      galleryUsersSection.innerHTML =
        "<p>No users have access to this gallery</p>";
      return;
    }

    let html = '<div class="users-with-access">';
    html += "<h3>Users with access</h3>";
    html += '<ul class="users-list">';

    users.forEach((user) => {
      html += `<li class="user-item">
        <span class="user-email">${user.email}</span>
        <button class="btn-remove" onclick="removeUserAccess(${user.id}, ${galleryId})">Remove</button>
      </li>`;
    });

    html += "</ul></div>";
    galleryUsersSection.innerHTML = html;
  } catch (error) {
    console.error("Error loading gallery users:", error);
    galleryUsersSection.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Function to remove user access
async function removeUserAccess(userId, galleryId) {
  if (!confirm("Are you sure you want to remove this user's access?")) {
    return;
  }

  try {
    const API_BASE_URL = "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/admin/gallery-access/${userId}/${galleryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove user access");
    }

    // Reload the users list
    loadGalleryUsers(galleryId);
  } catch (error) {
    console.error("Error removing user access:", error);
    alert(`Error: ${error.message}`);
  }
}

// Function to fetch and display all users
async function fetchUsers() {
  try {
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = '<div class="loading">Loading users...</div>';

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login");
      window.location.href = "index.html";
      return;
    }

    console.log("Using token for request:", token.substring(0, 15) + "..."); // Debug log

    // Use the correct API base URL
    const API_BASE_URL = "http://localhost:5000/api";

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    const data = await response.json();
    console.log("Users data:", data);

    if (data.users && data.users.length > 0) {
      usersList.innerHTML = "";

      data.users.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.innerHTML = `
          <div class="user-info">
            <span class="user-email">${user.email}</span>
            <span class="user-role">${user.role}</span>
          </div>
          <div class="user-actions">
            ${
              user.role !== "admin"
                ? `<button class="btn-edit" data-id="${user.id}">Edit</button>
               <button class="btn-delete" data-id="${user.id}">Delete</button>`
                : "<span>Admin user</span>"
            }
          </div>
        `;
        usersList.appendChild(userItem);
      });

      // Add event listeners to the edit and delete buttons
      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", (e) => {
          const userId = e.target.getAttribute("data-id");
          editUser(userId);
        });
      });

      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", (e) => {
          const userId = e.target.getAttribute("data-id");
          deleteUser(userId);
        });
      });
    } else {
      usersList.innerHTML = '<div class="placeholder">No users found</div>';
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    document.getElementById(
      "users-list"
    ).innerHTML = `<div class="error-message">Error loading users: ${error.message}</div>`;
  }
}

// Placeholder functions for edit and delete (implement these later)
function editUser(userId) {
  console.log("Edit user:", userId);
  // Implement user editing functionality
  alert("Edit user functionality will be implemented soon");
}

// Function to delete a user (admin only)
async function deleteUser(userId) {
  if (
    !confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    )
  ) {
    return;
  }

  const token = getToken();
  if (!token) {
    alert("You are not authenticated.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete user");
    }

    alert("User deleted successfully.");
    // Refresh user list after deletion
    loadUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    alert(`Error: ${error.message}`);
  }
}

// Add this to your existing event listeners in the admin.js file
document
  .getElementById("manage-users-btn")
  .addEventListener("click", function () {
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.style.display = "none";
    });
    document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.getElementById("users-section").style.display = "block";
    this.classList.add("active");

    // Fetch users when the section is shown
    fetchUsers();
  });

// Function to fetch all galleries
async function fetchGalleries() {
  try {
    const galleriesList = document.getElementById("galleries-list");
    galleriesList.innerHTML = '<div class="loading">Loading galleries...</div>';

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    const API_BASE_URL = "http://localhost:5000/api";

    const response = await fetch(`${API_BASE_URL}/galleries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch galleries");
    }

    const data = await response.json();

    if (data.galleries && data.galleries.length > 0) {
      galleriesList.innerHTML = "";

      data.galleries.forEach((gallery) => {
        const galleryElement = document.createElement("div");
        galleryElement.className = "list-item";
        galleryElement.innerHTML = `
          <div class="item-details">
            <h3>${gallery.name}</h3>
            <p>${gallery.description || "No description"}</p>
          </div>
          <div class="item-actions">
            <button class="btn-edit" onclick="editGallery(${
              gallery.id
            })">Edit</button>
            <button class="btn-delete" onclick="deleteGallery(${
              gallery.id
            })">Delete</button>
          </div>
        `;
        galleriesList.appendChild(galleryElement);
      });
    } else {
      galleriesList.innerHTML =
        '<div class="placeholder">No galleries found. Create your first gallery!</div>';
    }
  } catch (err) {
    console.error("Error fetching galleries:", err);
    document.getElementById(
      "galleries-list"
    ).innerHTML = `<div class="error-message">Error loading galleries: ${err.message}</div>`;
  }
}

// Function to add or update a gallery
async function saveGallery(event) {
  event.preventDefault();

  const galleryId = document.getElementById("gallery-id").value;
  const name = document.getElementById("gallery-name-input").value;
  const description = document.getElementById(
    "gallery-description-input"
  ).value;

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const API_BASE_URL = "http://localhost:5000/api";
  const method = galleryId ? "PUT" : "POST";
  const url = galleryId
    ? `${API_BASE_URL}/galleries/${galleryId}`
    : `${API_BASE_URL}/galleries`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save gallery");
    }

    // Close modal and refresh galleries
    document.getElementById("gallery-form-container").style.display = "none";
    fetchGalleries();

    // Reset form
    document.getElementById("gallery-form").reset();
    document.getElementById("gallery-id").value = "";
  } catch (err) {
    console.error("Error saving gallery:", err);
    alert(`Error: ${err.message}`);
  }
}

// Function to delete a gallery
async function deleteGallery(id) {
  if (!confirm("Are you sure you want to delete this gallery?")) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const API_BASE_URL = "http://localhost:5000/api";

  try {
    const response = await fetch(`${API_BASE_URL}/galleries/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete gallery");
    }

    fetchGalleries();
  } catch (err) {
    console.error("Error deleting gallery:", err);
    alert(`Error: ${err.message}`);
  }
}

// Function to open edit form for a gallery
function editGallery(id) {
  const API_BASE_URL = "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  fetch(`${API_BASE_URL}/galleries/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch gallery");
      return response.json();
    })
    .then((data) => {
      const gallery = data.gallery;

      document.getElementById("gallery-id").value = gallery.id;
      document.getElementById("gallery-name-input").value = gallery.name;
      document.getElementById("gallery-description-input").value =
        gallery.description || "";
      document.getElementById("gallery-thumbnail-input").value = "";
      document.getElementById("gallery-thumbnail-preview").innerHTML = "";

      document.getElementById("gallery-form-title").textContent =
        "Edit Gallery";
      document.getElementById("gallery-form-container").style.display = "block";

      // Show current thumbnail if exists
      if (gallery.thumbnail_url) {
        const imgPreview = document.createElement("img");
        imgPreview.src = gallery.thumbnail_url;
        imgPreview.alt = gallery.name;
        imgPreview.style.maxWidth = "200px";
        imgPreview.style.maxHeight = "150px";
        document
          .getElementById("gallery-thumbnail-preview")
          .appendChild(imgPreview);
      }
    })
    .catch((err) => {
      console.error("Error fetching gallery for edit:", err);
      alert(`Error: ${err.message}`);
    });
}

// Add event listeners when page loads
document.addEventListener("DOMContentLoaded", function () {
  // For existing functionality
  // checkAdminAccess();

  // Load galleries on page load if the galleries section is active
  if (document.getElementById("galleries-section").style.display !== "none") {
    fetchGalleries();
  }

  // Add gallery button
  document
    .getElementById("add-gallery-btn")
    .addEventListener("click", function () {
      document.getElementById("gallery-id").value = "";
      document.getElementById("gallery-form").reset();
      document.getElementById("gallery-form-title").textContent =
        "Add New Gallery";
      document.getElementById("gallery-form-container").style.display = "block";
    });

  // Close gallery form
  document
    .getElementById("close-gallery-form")
    .addEventListener("click", function () {
      document.getElementById("gallery-form-container").style.display = "none";
    });

  // Gallery form submission
  document
    .getElementById("gallery-form")
    .addEventListener("submit", saveGallery);

  // Navigation between sections
  document
    .getElementById("manage-galleries-btn")
    .addEventListener("click", function () {
      document.querySelectorAll(".admin-section").forEach((section) => {
        section.style.display = "none";
      });
      document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      document.getElementById("galleries-section").style.display = "block";
      this.classList.add("active");

      fetchGalleries();
    });

  // Add more event listeners for other sections if needed
});

// Add thumbnail preview functionality
document
  .getElementById("gallery-thumbnail-input")
  .addEventListener("change", function (e) {
    const previewContainer = document.getElementById(
      "gallery-thumbnail-preview"
    );
    previewContainer.innerHTML = "";

    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "200px";
        img.style.maxHeight = "150px";
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

// Function to populate the gallery access dropdown
function populateGalleryAccessDropdown() {
  // Get the gallery dropdown in the Gallery Access section
  const galleryDropdown = document.querySelector(
    '.Gallery Access select, select[id="access-gallery-select"]'
  );

  // If we can't find it with those selectors, try a more general approach
  if (!galleryDropdown) {
    // Look for any select element that might be the gallery dropdown
    const allSelects = document.querySelectorAll("select");
    for (const select of allSelects) {
      if (
        select.options[0] &&
        select.options[0].text.includes("Choose gallery")
      ) {
        console.log("Found gallery dropdown by option text");
        populateDropdown(select);
        return;
      }
    }
    console.error("Could not find gallery dropdown");
    return;
  }

  populateDropdown(galleryDropdown);
}

function populateDropdown(dropdown) {
  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    return;
  }

  console.log("Fetching galleries for dropdown");

  // Fetch galleries from API
  fetch(`http://localhost:5000/api/admin/available-galleries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch galleries");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Galleries fetched:", data);

      if (!data.galleries || data.galleries.length === 0) {
        console.warn("No galleries returned from API");
        return;
      }

      // Clear existing options except the default one
      while (dropdown.options.length > 1) {
        dropdown.remove(1);
      }

      // Add gallery options
      data.galleries.forEach((gallery) => {
        const option = document.createElement("option");
        option.value = gallery.id;
        option.textContent = gallery.name;
        dropdown.appendChild(option);
      });

      console.log(`Populated dropdown with ${data.galleries.length} galleries`);
    })
    .catch((error) => {
      console.error("Error loading galleries:", error);
    });
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the admin page
  document.querySelectorAll("h1").forEach((h1) => {
    if (h1.textContent.includes("Manage Users")) {
      console.log("Admin page detected, initializing gallery dropdown");
      populateGalleryAccessDropdown();
    }
  });
});
