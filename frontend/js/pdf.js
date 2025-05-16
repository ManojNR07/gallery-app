// Initialize PDF functionality
document.addEventListener("DOMContentLoaded", () => {
  const generatePdfBtn = document.getElementById("generate-pdf");

  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generatePDF);
  }
});

// Generate a PDF of the image details and comments
function generatePDF() {
  // Check if jsPDF is available
  if (typeof jspdf === "undefined") {
    alert("PDF library not loaded. Please try again later.");
    return;
  }

  // Get image details
  const imageName = document.getElementById("modal-image-name").textContent;
  const imageDescription = document.getElementById(
    "modal-image-description"
  ).textContent;
  const imageRating = document.getElementById("modal-avg-rating").textContent;
  const imageElement = document.getElementById("modal-image");
  const commentsContainer = document.getElementById("comments-container");

  // Create PDF
  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(22);
  doc.text(imageName, 105, 20, { align: "center" });

  // Add image (if possible)
  try {
    const imgData = getImageData(imageElement);
    doc.addImage(imgData, "JPEG", 15, 30, 180, 100);
  } catch (error) {
    console.error("Error adding image to PDF:", error);
    doc.setFontSize(12);
    doc.text("(Image could not be included in PDF)", 105, 70, {
      align: "center",
    });
  }

  // Add description
  doc.setFontSize(14);
  doc.text("Description:", 15, 140);
  doc.setFontSize(12);

  const descriptionLines = doc.splitTextToSize(
    imageDescription || "No description",
    180
  );
  doc.text(descriptionLines, 15, 150);

  // Add rating
  const yPos = 150 + descriptionLines.length * 7;
  doc.setFontSize(14);
  doc.text(`Average Rating: ${imageRating} out of 5`, 15, yPos);

  // Add comments
  doc.setFontSize(14);
  doc.text("Comments:", 15, yPos + 15);

  let commentYPos = yPos + 25;
  const comments = commentsContainer.querySelectorAll(".comment-item");

  if (comments.length === 0) {
    doc.setFontSize(12);
    doc.text("No comments yet", 15, commentYPos);
  } else {
    doc.setFontSize(12);

    comments.forEach((comment, index) => {
      // Check if we need a new page
      if (commentYPos > 270) {
        doc.addPage();
        commentYPos = 20;
      }

      const user = comment.querySelector(".comment-user").textContent;
      const rating = comment.querySelector(".comment-rating").textContent;
      const text = comment.querySelector(".comment-text").textContent;
      const date = comment.querySelector(".comment-date").textContent;

      doc.setFont("helvetica", "bold");
      doc.text(`${user} - ${rating}`, 15, commentYPos);
      doc.setFont("helvetica", "normal");

      const commentLines = doc.splitTextToSize(text, 180);
      doc.text(commentLines, 15, commentYPos + 7);

      doc.setFontSize(10);
      doc.text(date, 15, commentYPos + 7 + commentLines.length * 5);
      doc.setFontSize(12);

      commentYPos += 20 + commentLines.length * 5;
    });
  }

  // Save the PDF
  doc.save(`${imageName.replace(/\s+/g, "_")}_details.pdf`);
}

// Helper function to get image data for PDF
function getImageData(imgElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas dimensions to match image
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;

  // Draw image onto canvas
  ctx.drawImage(imgElement, 0, 0);

  // Get image data as base64 string
  return canvas.toDataURL("image/jpeg");
}
