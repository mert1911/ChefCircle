import { Router } from "express";
import { getTopChefs } from "../controllers/chef.controller";
import auth from "../middleware/auth";

const router = Router();

// GET /api/chefs/top
router.get("/top", auth, getTopChefs);

export default router;
