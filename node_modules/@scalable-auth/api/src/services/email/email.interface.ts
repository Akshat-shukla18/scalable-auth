export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
