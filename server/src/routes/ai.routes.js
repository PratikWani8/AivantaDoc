import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiQuerySchema } from "../validators/schemas.js";
import { queryAi } from "../controllers/ai.controller.js";

const router=Router();
router.use(protect);
router.post("/query",validate(aiQuerySchema),queryAi);
export default router;
