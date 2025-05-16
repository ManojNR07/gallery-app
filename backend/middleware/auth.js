// Authentication middleware
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  console.log("Authenticating request to:", req.originalUrl);

  const authHeader = req.headers.authorization;
  console.log("Auth header:", authHeader ? "Present" : "Missing");

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ message: "Invalid authorization format. Use: Bearer <token>" });
  }

  const token = parts[1];
  console.log(
    "Received token (first 10 chars):",
    token.substring(0, 10) + "..."
  );

  try {
    // Use your actual secret key from environment variables
    const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret_key";

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token decoded successfully. User ID:", decoded.id);

    // Add user info to request object
    req.user = decoded;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(403).json({ message: "Failed to authenticate token" });
  }
};

module.exports = authenticateJWT;
