import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  overview,
  spendingTrends,
  vendorPerformance,
  riskDistribution,
  documentTrends,
  financialLeakage,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/overview", overview);

router.get("/spending-trends", spendingTrends);

router.get("/vendor-performance", vendorPerformance);

router.get("/risk-distribution", riskDistribution);

router.get("/document-trends", documentTrends);

router.get("/financial-leakage", financialLeakage);

export default router;