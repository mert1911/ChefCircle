import { Router } from "express";
import { getTrendingTags } from "../controllers/tag.controller";

const router = Router();

// GET /api/tags/trending
router.get("/trending", getTrendingTags);

export default router;
