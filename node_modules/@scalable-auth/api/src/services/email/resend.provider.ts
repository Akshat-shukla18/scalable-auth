import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export class ResendEmailProvider implements IEmailProvider {
  readonly name = "resend";

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    if (!env.EMAIL_API_KEY) {
      throw new Error("Resend API key is not configured in EMAIL_API_KEY");
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: params.to,
          subject: params.subject,
          text: params.text,
          html: params.html
        })
      });

      const data = (await res.json()) as { id?: string; error?: unknown };
      if (!res.ok) {
        logger.error({ resendError: data }, "Resend API returned error");
        return { success: false, error: JSON.stringify(data) };
      }

      return { success: true, messageId: data.id };
    } catch (err: any) {
      logger.error({ err }, "Failed to send email via Resend");
      return { success: false, error: err.message };
    }
  }
}
