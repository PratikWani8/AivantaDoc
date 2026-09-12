import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  listTransactions,
  getTransaction,
  trustScore,
  relationships,
  approveTransaction,
  rejectTransaction,
} from "../controllers/transaction.controller.js";

const router = Router();

router.use(protect);

router.get("/", listTransactions);

router.get("/:id/trust-score", trustScore);

router.get("/:id/relationships", relationships);

router.post("/:id/approve", approveTransaction);

router.post("/:id/reject", rejectTransaction);

router.get("/:id", getTransaction);

export default router;