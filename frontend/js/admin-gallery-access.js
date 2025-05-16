// Admin Gallery Access Management

// Define API base URL
const API_URL = "http://localhost:5000/api"; // Change this to match your backend server URL

document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin gallery access script loaded");

  // Find the existing gallery dropdown in the Gallery Access section
  // This targets the select element under the Gallery Access section
  const galleryAccessSection = document.querySelector(
    ".Gallery Access, div:contains('Gallery Access')"
  );
  const galleryDropdown = document.querySelector(
    "select[id='access-gallery-select'], select:contains('Choose gallery')"
  );

  console.log("Gallery dropdown found:", galleryDropdown);

  if (galleryDropdown) {
    console.log("Initializing gallery access management");

    // Load available galleries for dropdown
    loadGalleries(galleryDropdown);

    // Add change event to load users when gallery is selected
    galleryDropdown.addEventListener("change", function () {
      const galleryId = this.value;
      if (galleryId) {
        // Handle gallery selection
        console.log("Selected gallery ID:", galleryId);
        // You can add code here to load users with access to this gallery
      }
    });
  } else {
    console.error("Gallery dropdown not found in the page");
  }
});

// Load all galleries for the dropdown
function loadGalleries(galleryDropdown) {
  if (!galleryDropdown) {
    console.error("Gallery dropdown element not provided");
    return;
  }

  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    return;
  }

  console.log("Fetching galleries for dropdown");

  // Fetch galleries from API
  fetch(`${API_URL}/admin/available-galleries`, {
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
      while (galleryDropdown.options.length > 1) {
        galleryDropdown.remove(1);
      }

      // Add gallery options
      data.galleries.forEach((gallery) => {
        const option = document.createElement("option");
        option.value = gallery.id;
        option.textContent = gallery.name;
        galleryDropdown.appendChild(option);
        console.log(
          `Added gallery option: ${gallery.name} (ID: ${gallery.id})`
        );
      });

      console.log(`Populated dropdown with ${data.galleries.length} galleries`);
    })
    .catch((error) => {
      console.error("Error loading galleries:", error);
    });
}

// Load users with access to selected gallery
function loadUsersWithAccess(galleryId) {
  const userGallerySection = document.getElementById("user-gallery-section");
  if (!userGallerySection) return;

  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    return;
  }

  console.log(`Fetching users with access to gallery ${galleryId}`);

  // Show loading state
  userGallerySection.innerHTML = "<p>Loading users...</p>";

  // Fetch users with access from API - Use the correct API_URL
  fetch(`${API_URL}/admin/gallery-access/${galleryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch users with gallery access");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Users with access fetched:", data);

      if (data.users && data.users.length > 0) {
        // Render user list
        const userList = document.createElement("div");
        userList.className = "user-access-list";

        data.users.forEach((user) => {
          const userItem = document.createElement("div");
          userItem.className = "user-access-item";
          userItem.innerHTML = `
                    <span>${user.email}</span>
                    <button class="remove-access-btn" data-user-id="${user.id}" data-gallery-id="${galleryId}">
                        Remove Access
                    </button>
                `;
          userList.appendChild(userItem);
        });

        userGallerySection.innerHTML = "";
        userGallerySection.appendChild(userList);

        // Add event listeners to remove buttons
        document.querySelectorAll(".remove-access-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const userId = this.getAttribute("data-user-id");
            const galleryId = this.getAttribute("data-gallery-id");
            removeUserAccess(userId, galleryId);
          });
        });
      } else {
        userGallerySection.innerHTML =
          "<p>No users have access to this gallery</p>";
      }

      // Add form to grant access to new users
      const grantAccessForm = document.createElement("div");
      grantAccessForm.className = "grant-access-form";
      grantAccessForm.innerHTML = `
            <h4>Grant Access</h4>
            <select id="user-select">
                <option value="">Select a user</option>
                <!-- User options will be loaded dynamically -->
            </select>
            <button id="grant-access-btn">Grant Access</button>
        `;
      userGallerySection.appendChild(grantAccessForm);

      // Load available users
      loadAvailableUsers(galleryId);

      // Add event listener to grant access button
      document
        .getElementById("grant-access-btn")
        .addEventListener("click", function () {
          const userId = document.getElementById("user-select").value;
          if (userId) {
            grantUserAccess(userId, galleryId);
          } else {
            alert("Please select a user");
          }
        });
    })
    .catch((error) => {
      console.error("Error loading users with gallery access:", error);
      userGallerySection.innerHTML =
        "<p>Failed to load users. Please try again later.</p>";
    });
}

// Load users available to grant access
function loadAvailableUsers(galleryId) {
  const userSelect = document.getElementById("user-select");
  if (!userSelect) return;

  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) return;

  // Fetch all users - Use the correct API_URL
  fetch(`${API_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.users && data.users.length > 0) {
        // First get users who already have access
        fetch(`${API_URL}/admin/gallery-access/${galleryId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((accessData) => {
            // Filter out users who already have access
            const usersWithAccess = new Set(
              accessData.users.map((user) => user.id)
            );
            const availableUsers = data.users.filter(
              (user) => !usersWithAccess.has(user.id)
            );

            // Clear existing options except the default one
            while (userSelect.options.length > 1) {
              userSelect.remove(1);
            }

            // Add user options
            availableUsers.forEach((user) => {
              const option = document.createElement("option");
              option.value = user.id;
              option.textContent = user.email;
              userSelect.appendChild(option);
            });
          });
      }
    })
    .catch((error) => {
      console.error("Error loading available users:", error);
    });
}

// Grant access to a user
function grantUserAccess(userId, galleryId) {
  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${API_URL}/admin/gallery-access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, galleryId }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to grant gallery access");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Access granted:", data);
      alert("Access granted successfully");

      // Reload users with access
      loadUsersWithAccess(galleryId);
    })
    .catch((error) => {
      console.error("Error granting access:", error);
      alert("Failed to grant access. Please try again later.");
    });
}

// Remove access from a user
function removeUserAccess(userId, galleryId) {
  if (!confirm("Are you sure you want to remove this user's access?")) {
    return;
  }

  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${API_URL}/admin/gallery-access/${userId}/${galleryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to revoke gallery access");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Access revoked:", data);
      alert("Access revoked successfully");

      // Reload users with access
      loadUsersWithAccess(galleryId);
    })
    .catch((error) => {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access. Please try again later.");
    });
}
