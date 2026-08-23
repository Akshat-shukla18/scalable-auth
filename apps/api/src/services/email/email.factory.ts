import { IEmailProvider } from "./email.interface.js";
import { MockEmailProvider } from "./mock.provider.js";
import { ResendEmailProvider } from "./resend.provider.js";
import { SmtpEmailProvider } from "./smtp.provider.js";
import { env } from "../../config/env.js";

let providerInstance: IEmailProvider;

export function getEmailProvider(): IEmailProvider {
  if (providerInstance) {
    return providerInstance;
  }

  switch (env.EMAIL_PROVIDER) {
    case "resend":
      providerInstance = new ResendEmailProvider();
      break;
    case "smtp":
      providerInstance = new SmtpEmailProvider();
      break;
    case "mock":
    default:
      providerInstance = new MockEmailProvider();
      break;
  }

  return providerInstance;
}
