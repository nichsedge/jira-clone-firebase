
import { SettingsForm } from "./settings-form";

export default function SettingsPage() {
  const imapUser = process.env.IMAP_USER || "Not Configured";

  return (
    <SettingsForm imapUser={imapUser} />
  );
}
