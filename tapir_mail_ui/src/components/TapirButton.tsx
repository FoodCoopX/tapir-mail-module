import { Button } from "react-bootstrap";
import React from "react";
import { ButtonVariant } from "react-bootstrap/types";

interface TapirButtonProps {
  variant: ButtonVariant;
  text: string;
  icon: React.ComponentType<{ style: any }>;
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
    >
      <span>{props.text}</span>
      <props.icon style={{ width: "1.5em" }} />
    </Button>
  );
};

export default TapirButton;
