import React from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { Trigger } from "../api_client";

interface TriggerDropdownProps {
  triggers: Trigger[];
  onTriggerSelected: (trigger_id: string | null) => void;
  selectedTriggerId: string | null;
}

const TriggerDropdown: React.FC<TriggerDropdownProps> = ({
  triggers,
  onTriggerSelected,
  selectedTriggerId,
}) => {
  const selectedTrigger = triggers.find(
    (trigger) => trigger.id === selectedTriggerId,
  );

  return (
    <DropdownButton
      id="triggers-dropdown"
      title={selectedTrigger ? selectedTrigger.name : "Select a trigger"}
      onSelect={onTriggerSelected}
    >
      {triggers.map((trigger) => (
        <Dropdown.Item
          key={trigger.id}
          eventKey={trigger.id}
        >
          {trigger.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export default TriggerDropdown;
