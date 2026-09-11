import { Router } from "express";
import { registerController,loginController,logoutController,meController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema,loginSchema } from "../validators/schemas.js";
import { protect } from "../middleware/auth.js";

const router=Router();
router.post("/register",validate(registerSchema),registerController);
router.post("/login",validate(loginSchema),loginController);
router.post("/logout",protect,logoutController);
router.get("/me",protect,meController);
export default router;
