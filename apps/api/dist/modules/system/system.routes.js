import { Router } from "express";
import { systemController } from "./system.controller.js";
const router = Router();
router.get("/health", systemController.health);
router.get("/ready", systemController.ready);
router.get("/metrics", systemController.metrics);
export const systemRoutes = router;
//# sourceMappingURL=system.routes.js.map