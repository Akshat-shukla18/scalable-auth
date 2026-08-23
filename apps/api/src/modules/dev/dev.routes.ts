import { Router, Request, Response } from "express";
import { MockEmailProvider } from "../../services/email/mock.provider.js";

const router = Router();

router.get("/mailbox", (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  const emails = MockEmailProvider.getMailbox(email);
  res.json({
    success: true,
    data: {
      count: emails.length,
      emails
    }
  });
});

router.get("/mailbox/latest-code", (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ success: false, error: "email query parameter is required" });
    return;
  }
  const code = MockEmailProvider.getLatestCodeForEmail(email);
  res.json({ success: true, data: { email, code } });
});

router.delete("/mailbox", (req: Request, res: Response) => {
  MockEmailProvider.clearMailbox();
  res.json({ success: true, message: "Dev mailbox cleared" });
});

export const devRoutes = router;
