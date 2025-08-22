
import { SettingsForm } from "./settings-form";

export default function SettingsPage() {
  // All settings logic, including loading from environment variables for defaults,
  // has been moved to the client-side `SettingsForm` and its dependencies
  // to prevent leaking any server-side variables to the client build.
  // The form will now load defaults from localStorage if available.
  return (
    <SettingsForm />
  );
}
