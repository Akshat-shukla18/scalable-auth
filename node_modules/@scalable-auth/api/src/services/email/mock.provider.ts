import { IEmailProvider, SendEmailParams, SendEmailResult } from "./email.interface.js";
import { logger } from "../../config/logger.js";

export interface MockEmailRecord extends SendEmailParams {
  id: string;
  sentAt: string;
}

export class MockEmailProvider implements IEmailProvider {
  readonly name = "mock";
  private static mailbox: MockEmailRecord[] = [];
  private static readonly MAX_HISTORY = 200;

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const id = `mock-mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: MockEmailRecord = {
      ...params,
      id,
      sentAt: new Date().toISOString()
    };

    MockEmailProvider.mailbox.unshift(record);
    if (MockEmailProvider.mailbox.length > MockEmailProvider.MAX_HISTORY) {
      MockEmailProvider.mailbox.pop();
    }

    logger.info(
      {
        messageId: id,
        to: params.to,
        subject: params.subject,
        metadata: params.metadata
      },
      "📧 [MOCK EMAIL DELIVERED]"
    );

    return {
      success: true,
      messageId: id
    };
  }

  static getMailbox(filterEmail?: string): MockEmailRecord[] {
    if (filterEmail) {
      return MockEmailProvider.mailbox.filter((m) => m.to.toLowerCase() === filterEmail.toLowerCase());
    }
    return [...MockEmailProvider.mailbox];
  }

  static getLatestCodeForEmail(email: string): string | null {
    const records = MockEmailProvider.getMailbox(email);
    if (records.length === 0) return null;
    const latest = records[0];
    const match = latest.text.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  }

  static clearMailbox(): void {
    MockEmailProvider.mailbox = [];
  }
}
