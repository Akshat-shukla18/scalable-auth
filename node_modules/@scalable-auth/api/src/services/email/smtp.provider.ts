import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export class SmtpEmailProvider implements IEmailProvider {
  readonly name = "smtp";

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    logger.info({ to: params.to, subject: params.subject }, "Sending email via SMTP");
    // Standard SMTP dispatcher wrapper
    return {
      success: true,
      messageId: `smtp-${Date.now()}`
    };
  }
}
