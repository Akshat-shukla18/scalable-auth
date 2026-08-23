import { Router } from "express";
import { MockEmailProvider } from "../../services/email/mock.provider.js";
const router = Router();
router.get("/mailbox", (req, res) => {
    const email = req.query.email;
    const emails = MockEmailProvider.getMailbox(email);
    res.json({
        success: true,
        data: {
            count: emails.length,
            emails
        }
    });
});
router.get("/mailbox/latest-code", (req, res) => {
    const email = req.query.email;
    if (!email) {
        res.status(400).json({ success: false, error: "email query parameter is required" });
        return;
    }
    const code = MockEmailProvider.getLatestCodeForEmail(email);
    res.json({ success: true, data: { email, code } });
});
router.delete("/mailbox", (req, res) => {
    MockEmailProvider.clearMailbox();
    res.json({ success: true, message: "Dev mailbox cleared" });
});
export const devRoutes = router;
//# sourceMappingURL=dev.routes.js.map