import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
export interface MockEmailRecord extends SendEmailParams {
    id: string;
    sentAt: string;
}
export declare class MockEmailProvider implements IEmailProvider {
    readonly name = "mock";
    private static mailbox;
    private static readonly MAX_HISTORY;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    static getMailbox(filterEmail?: string): MockEmailRecord[];
    static getLatestCodeForEmail(email: string): string | null;
    static clearMailbox(): void;
}
//# sourceMappingURL=mock.provider.d.ts.map