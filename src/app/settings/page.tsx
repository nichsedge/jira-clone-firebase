

import { SettingsForm } from "./settings-form";
import { EmailSettings } from "@/lib/types";

export default function SettingsPage() {
  // These defaults are now only used on the server and not passed to the client component.
  // The client component will handle its own state and local storage.
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

  // We pass the non-sensitive parts of the default settings to the client component.
  // The client component will fetch the full (and potentially sensitive) settings from localStorage.
  const clientDefaultSettings = {
    smtp: {
        host: defaultEmailSettings.smtp.host,
        port: defaultEmailSettings.smtp.port,
        user: defaultEmailSettings.smtp.user,
        pass: '', // Never send password to client
        tls: defaultEmailSettings.smtp.tls,
    },
    imap: {
        host: defaultEmailSettings.imap.host,
        port: defaultEmailSettings.imap.port,
        user: defaultEmailSettings.imap.user,
        pass: '', // Never send password to client
        tls: defaultEmailSettings.imap.tls,
    }
  };


  return (
    <SettingsForm defaultEmailSettings={clientDefaultSettings} />
  );
}
