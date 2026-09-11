import { Router } from "express";

import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

import {
  uploadDocument,
  listDocuments,
  getDocument,
  documentStatus,
  extractedData,
  deleteDocument,
  reprocessDocument,
  verifyDocument,
  approveDocument,
  rejectDocument,
} from "../controllers/document.controller.js"

const router = Router();

router.use(protect);

router.post(
  "/upload",
  upload.single("file"),
  uploadDocument
);

router.get("/", listDocuments);

router.get("/:id/status", documentStatus);

router.get("/:id/extracted-data", extractedData);

router.post("/:id/verify", verifyDocument);

router.post("/:id/approve", approveDocument);

router.post("/:id/reject", rejectDocument);

router.delete("/:id", deleteDocument);

router.post("/:id/reprocess", reprocessDocument);

router.post("/:id/verify", verifyDocument)
router.post("/:id/approve", approveDocument)
router.post("/:id/reject", rejectDocument)

router.get("/:id", getDocument);

export default router;