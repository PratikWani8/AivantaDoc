import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  risks,
  riskSummary,
  riskById,
  resolveRisk,
  anomalies,
  anomalySummary,
} from "../controllers/risk.controller.js";

const router = Router();

router.use(protect);

router.get("/", risks);

router.get("/summary", riskSummary);

router.get("/:id", riskById);

router.post("/:id/resolve", resolveRisk);

export const anomalyRouter = Router();

anomalyRouter.use(protect);

anomalyRouter.get("/", anomalies);

anomalyRouter.get("/summary", anomalySummary);

export default router;