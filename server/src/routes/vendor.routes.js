import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  vendors,
  vendor,
  performance,
  risk,
  transactions,
} from "../controllers/vendor.controller.js";

const router = Router();

router.use(protect);

router.get("/", vendors);

router.get("/:id/performance", performance);

router.get("/:id/risks", risk);

router.get("/:id/transactions", transactions);

router.get("/:id", vendor);

export default router;