import { Button } from "react-bootstrap";
import React from "react";
import { ButtonVariant } from "react-bootstrap/types";

interface TapirButtonProps {
  variant: ButtonVariant;
  text: string;
  icon: React.ComponentType<{ style: any }>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const TapirButton: React.FC<TapirButtonProps> = (props) => {
  return (
    <Button
      variant={props.variant}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "2px",
      }}
      onClick={props.onClick}
    >
      <span>{props.text}</span>
      <props.icon style={{ width: "1.5em" }} />
    </Button>
  );
};

export default TapirButton;
