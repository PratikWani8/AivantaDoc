export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" }
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: { code: "FILE_TOO_LARGE", message: "Uploaded file exceeds the allowed size." }
    });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: status >= 500 && process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : (err.message || "Unexpected server error")
    }
  });
}
