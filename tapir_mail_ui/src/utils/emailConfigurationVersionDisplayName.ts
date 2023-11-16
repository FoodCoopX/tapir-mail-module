import { EmailConfigurationVersion, StatusEnum } from "../api_client";
import { EMAIL_CONFIGURATION_VERSION_STATUS_PROPS } from "./emailConfigurationVersionStatusProps";
import { formatDate } from "./formatDate";

export function getDisplayName(version?: EmailConfigurationVersion) {
  if (!version) return "";
  return `${
    EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[version.status!! as StatusEnum]
      .text
  } ${formatDate(version.updatedAt)}`;
}
