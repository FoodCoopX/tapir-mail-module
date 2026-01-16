import { ModeEnum } from "../api_client";

export function getModeDisplay(mode: ModeEnum, longVersion: boolean) {
  let result;
  switch (mode) {
    case "always_on":
      result = "Pflicht";
      if (longVersion) {
        result += " (Mitglieder können sich nicht austragen)";
      }
      return result;
    case "optional_default_off":
      result = "Optional, Standard: aus";
      if (longVersion) {
        result +=
          " (Mitglieder müssen sich manuell eintragen um die Mails zu bekommen)";
      }
      return result;
    case "optional_default_on":
      result = "Optional, Standard: an";
      if (longVersion) {
        result +=
          "  (Mitglieder müssen sich manuell austragen um die Mails nicht zu bekommen)";
      }
      return result;
  }
}
