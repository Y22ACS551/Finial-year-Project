const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse
        .unauthorized("Authentication token required")
        .send(res);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ SUPPORT ALL TOKEN FORMATS (CRITICAL)
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return ApiResponse
        .unauthorized("Invalid token payload")
        .send(res);
    }

    req.user = {
      _id: userId,
      role: decoded.role || null,
    };

    req.token = token;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return ApiResponse
      .unauthorized("Invalid or expired token")
      .send(res);
  }
};

module.exports = auth;