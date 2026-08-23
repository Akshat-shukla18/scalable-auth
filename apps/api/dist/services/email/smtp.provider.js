import { logger } from "../../config/logger.js";
export class SmtpEmailProvider {
    name = "smtp";
    async sendEmail(params) {
        logger.info({ to: params.to, subject: params.subject }, "Sending email via SMTP");
        // Standard SMTP dispatcher wrapper
        return {
            success: true,
            messageId: `smtp-${Date.now()}`
        };
    }
}
//# sourceMappingURL=smtp.provider.js.map