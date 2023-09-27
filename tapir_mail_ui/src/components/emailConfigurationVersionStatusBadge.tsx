import { StatusEnum } from "../api_client";
import { Badge } from "react-bootstrap";
import { EMAIL_CONFIGURATION_VERSION_STATUS_PROPS } from "../utils/emailConfigurationVersionStatusProps";
import React from "react";

interface EmailConfigurationVersionStatusBadgeProps {
  status: StatusEnum;
}

const EmailConfigurationVersionStatusBadge: React.FC<
  EmailConfigurationVersionStatusBadgeProps
> = ({ status }) => {
  const props = EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[status];
  return (
    <Badge
      bg={props.color}
      pill={true}
    >
      {props.text}
    </Badge>
  );
};

export default EmailConfigurationVersionStatusBadge;
