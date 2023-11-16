import React, { ReactNode } from "react";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

interface TapirTooltipProps {
  id: string;
  children: ReactNode;
  text: string;
  enabled?: boolean;
}

const TapirTooltip: React.FC<TapirTooltipProps> = ({
  id,
  children,
  text,
  enabled,
}) => {
  const overlay =
    enabled === undefined || enabled ? (
      <Tooltip id={id}>{text}</Tooltip>
    ) : (
      <></>
    );
  return (
    <OverlayTrigger overlay={overlay}>
      <span>{children}</span>
    </OverlayTrigger>
  );
};

export default TapirTooltip;
