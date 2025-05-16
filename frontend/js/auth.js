// Base URL for API requests
const API_BASE_URL = "http://localhost:5000/api";

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem("token") !== null;
}

// Get current user data
function getCurrentUser() {
  const id = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole");

  if (!id) return null;

  return { id, email, role };
}

// Check if user is admin
function isAdmin() {
  const role = localStorage.getItem("userRole");
  return role === "admin";
}

// Get user ID
function getUserId() {
  return localStorage.getItem("userId");
}

// Get user role
function getUserRole() {
  return localStorage.getItem("userRole");
}

// Redirect if not logged in
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
  }
}

// Show admin elements if user is admin
function setupAdminUI() {
  const adminNavItem = document.getElementById("admin-nav");
  if (adminNavItem) {
    adminNavItem.style.display = isAdmin() ? "block" : "none";
  }
}

// Handle logout
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Remove all user data
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      window.location.href = "index.html";
    });
  }
}

// Initialize auth on all pages
document.addEventListener("DOMContentLoaded", () => {
  // Don't require auth on login page
  if (!window.location.pathname.includes("index.html")) {
    requireAuth();
    setupAdminUI();
    setupLogout();
  }

  // Handle login form submission
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorMessage = document.getElementById("error-message");

      try {
        errorMessage.textContent = "";
        const data = await fetchAPI("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        // Store each piece of user data separately
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        console.log(`Logged in as ${data.user.role} with ID: ${data.user.id}`);
        window.location.href = "galleries.html";
      } catch (error) {
        errorMessage.textContent = error.message;
      }
    });
  }

  // Handle register form
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password"
      ).value;
      const role = document.getElementById("register-role").value;
      const errorMessage = document.getElementById("register-error-message");

      console.log("Registering with role:", role); // Debug log

      if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match";
        return;
      }

      try {
        errorMessage.textContent = "";
        const requestBody = { email, password, role };
        console.log("Sending registration data:", requestBody); // Debug log

        await fetchAPI("/users/register", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        // Show success message and switch back to login
        alert("Registration successful! Please log in.");
        document.getElementById("register-card").style.display = "none";
        document.querySelector(".login-card").style.display = "block";
      } catch (error) {
        errorMessage.textContent = error.message;
      }
    });
  }

  // Toggle between login and register forms
  const registerLink = document.getElementById("register-link");
  const backToLoginBtn = document.getElementById("back-to-login");

  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(".login-card").style.display = "none";
      document.getElementById("register-card").style.display = "block";
    });
  }

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", () => {
      document.getElementById("register-card").style.display = "none";
      document.querySelector(".login-card").style.display = "block";
    });
  }

  // Call updateNavMenu when the DOM is loaded
  updateNavMenu();
});

// Function to update navigation menu based on authentication status
function updateNavMenu() {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const loginItem = document.getElementById("login-item");
  const profileItem = document.getElementById("profile-item");
  const adminItem = document.getElementById("admin-item");
  const logoutItem = document.getElementById("logout-item");

  if (token) {
    // User is logged in
    if (loginItem) loginItem.style.display = "none";
    if (profileItem) profileItem.style.display = "block";
    if (logoutItem) logoutItem.style.display = "block";

    // Show admin link if user is an admin
    if (userRole === "admin") {
      if (adminItem) adminItem.style.display = "block";
    } else {
      if (adminItem) adminItem.style.display = "none";
    }

    // Add logout functionality
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
  } else {
    // User is not logged in
    if (loginItem) loginItem.style.display = "block";
    if (profileItem) profileItem.style.display = "none";
    if (adminItem) adminItem.style.display = "none";
    if (logoutItem) logoutItem.style.display = "none";
  }
}

// Function to log out user
function logout() {
  // Clear local storage
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");

  // Redirect to home page
  window.location.href = "index.html";
}
