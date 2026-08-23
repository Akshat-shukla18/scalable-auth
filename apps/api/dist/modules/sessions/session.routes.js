import { Router } from "express";
import { sessionController } from "./session.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = Router();
router.use(authenticate);
router.get("/", sessionController.list);
router.delete("/:id", sessionController.revoke);
export const sessionRoutes = router;
//# sourceMappingURL=session.routes.js.map