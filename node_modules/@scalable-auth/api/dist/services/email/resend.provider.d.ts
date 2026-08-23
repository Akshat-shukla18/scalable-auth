import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
export declare class ResendEmailProvider implements IEmailProvider {
    readonly name = "resend";
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=resend.provider.d.ts.map