// Initialize gallery page
document.addEventListener("DOMContentLoaded", () => {
  const isGalleryListPage = window.location.pathname.includes("galleries.html");

  if (isGalleryListPage) {
    loadGalleries();
    setupViewToggle();
    setupGalleryFilter();
  }
});

// Load all galleries
async function loadGalleries() {
  const container = document.getElementById("galleries-container");

  try {
    container.innerHTML = '<div class="loading">Loading galleries...</div>';
    const galleries = await fetchAPI("/galleries");

    if (galleries.length === 0) {
      container.innerHTML =
        '<div class="placeholder">No galleries available</div>';
      return;
    }

    // Populate gallery filter
    const filterSelect = document.getElementById("gallery-filter");
    if (filterSelect) {
      galleries.forEach((gallery) => {
        const option = document.createElement("option");
        option.value = gallery.id;
        option.textContent = gallery.name;
        filterSelect.appendChild(option);
      });
    }

    displayGalleries(galleries);
  } catch (error) {
    container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
}

// Display galleries in current view mode
function displayGalleries(galleries) {
  const container = document.getElementById("galleries-container");
  const isGridView = container.classList.contains("grid-view");

  container.innerHTML = "";

  if (isGridView) {
    galleries.forEach((gallery) => {
      container.appendChild(createGalleryCard(gallery));
    });
  } else {
    // Table view header
    const headerRow = document.createElement("div");
    headerRow.classList.add("table-row", "table-header");

    const headers = ["Name", "Thumbnail", "Rating", "Comments"];
    headers.forEach((header) => {
      const cell = document.createElement("div");
      cell.classList.add("table-cell");
      cell.textContent = header;
      headerRow.appendChild(cell);
    });

    container.appendChild(headerRow);

    // Table rows
    galleries.forEach((gallery) => {
      container.appendChild(createGalleryTableRow(gallery));
    });
  }
}

// Create a gallery card for grid view
function createGalleryCard(gallery) {
  const card = document.createElement("div");
  card.classList.add("gallery-card");
  card.addEventListener("click", () => {
    window.location.href = `gallery-detail.html?id=${gallery.id}`;
  });

  // Find the first image to use as thumbnail or use placeholder
  const thumbnailUrl =
    gallery.thumbnail || "https://via.placeholder.com/300x200?text=No+Images";

  card.innerHTML = `
        <div class="gallery-thumbnail">
            <img src="${thumbnailUrl}" alt="${gallery.name}">
        </div>
        <div class="gallery-info">
            <h3>${gallery.name}</h3>
            <p>${gallery.description || "No description"}</p>
            <div class="gallery-meta">
                <span>${gallery.rating || 0} ★</span>
                <span>${gallery.commentCount || 0} comments</span>
            </div>
        </div>
    `;

  return card;
}

// Create a gallery row for table view
function createGalleryTableRow(gallery) {
  const row = document.createElement("div");
  row.classList.add("table-row");
  row.addEventListener("click", () => {
    window.location.href = `gallery-detail.html?id=${gallery.id}`;
  });

  // Find the first image to use as thumbnail or use placeholder
  const thumbnailUrl =
    gallery.thumbnail || "https://via.placeholder.com/300x200?text=No+Images";

  row.innerHTML = `
        <div class="table-cell">${gallery.name}</div>
        <div class="table-cell thumbnail-cell">
            <img src="${thumbnailUrl}" alt="${gallery.name}">
        </div>
        <div class="table-cell">${gallery.rating || 0} ★</div>
        <div class="table-cell">${gallery.commentCount || 0}</div>
    `;

  return row;
}

// Setup view toggle (grid vs table)
function setupViewToggle() {
  const gridBtn = document.getElementById("grid-view-btn");
  const tableBtn = document.getElementById("table-view-btn");
  const container = document.getElementById("galleries-container");

  if (gridBtn && tableBtn) {
    gridBtn.addEventListener("click", () => {
      gridBtn.classList.add("active");
      tableBtn.classList.remove("active");
      container.classList.add("grid-view");
      container.classList.remove("table-view");

      // Reload galleries in grid view
      const galleries = getDisplayedGalleries();
      if (galleries.length > 0) {
        displayGalleries(galleries);
      }
    });

    tableBtn.addEventListener("click", () => {
      tableBtn.classList.add("active");
      gridBtn.classList.remove("active");
      container.classList.add("table-view");
      container.classList.remove("grid-view");

      // Reload galleries in table view
      const galleries = getDisplayedGalleries();
      if (galleries.length > 0) {
        displayGalleries(galleries);
      }
    });
  }
}

// Helper to get currently displayed galleries
function getDisplayedGalleries() {
  // This would typically get data from your state management
  // For simplicity, we're using a placeholder
  return []; // Would be populated in a real application
}

// Setup gallery filter
function setupGalleryFilter() {
  const filterSelect = document.getElementById("gallery-filter");

  if (filterSelect) {
    filterSelect.addEventListener("change", async () => {
      const galleryId = filterSelect.value;
      const container = document.getElementById("galleries-container");

      try {
        container.innerHTML = '<div class="loading">Loading galleries...</div>';

        let galleries;
        if (galleryId) {
          // Filter to specific gallery
          const gallery = await fetchAPI(`/galleries/${galleryId}`);
          galleries = [gallery];
        } else {
          // Show all galleries
          galleries = await fetchAPI("/galleries");
        }

        displayGalleries(galleries);
      } catch (error) {
        container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
      }
    });
  }
}
