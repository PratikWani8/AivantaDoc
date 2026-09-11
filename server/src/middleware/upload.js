import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadDir, { recursive: true });

const allowed = new Map([
  [".pdf", new Set(["application/pdf"])],
  [".png", new Set(["image/png"])],
  [".jpg", new Set(["image/jpeg"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".webp", new Set(["image/webp"])]
]);

const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const types = allowed.get(ext);
  if (!types || !types.has(file.mimetype)) {
    return cb(Object.assign(new Error("Unsupported or mismatched file type"), { statusCode:422, code:"INVALID_FILE_TYPE" }));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSize, files: 1 }
});
