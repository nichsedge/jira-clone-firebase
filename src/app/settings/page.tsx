

import { SettingsForm } from "./settings-form";
import { EmailSettings } from "@/lib/types";

export default function SettingsPage() {
  const defaultEmailSettings: EmailSettings = {
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      tls: process.env.SMTP_TLS ? process.env.SMTP_TLS === 'true' : true,
    },
    imap: {
      host: process.env.IMAP_HOST || "",
      port: process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT, 10) : 993,
      user: process.env.IMAP_USER || "",
      pass: process.env.IMAP_PASS || "",
      tls: process.env.IMAP_TLS ? process.env.IMAP_TLS === 'true' : true,
    }
  };

  return (
    <SettingsForm defaultEmailSettings={defaultEmailSettings} />
  );
}
