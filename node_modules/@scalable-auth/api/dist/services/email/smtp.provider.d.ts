import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
export declare class SmtpEmailProvider implements IEmailProvider {
    readonly name = "smtp";
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=smtp.provider.d.ts.map