import React, { useEffect, useState } from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { Trigger, TriggersApi } from "../api_client";
import { useApi } from "../hooks/useApi";

interface TriggerDropdownProps {
  selectedTriggerId: string | null;
  onChange: (version: string) => void;
}

const TriggerDropdown: React.FC<TriggerDropdownProps> = ({
  selectedTriggerId,
  onChange,
}) => {
  const triggersApi = useApi(TriggersApi);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const selectedTrigger = triggers.find(
    (trigger) => trigger.id === selectedTriggerId,
  );

  useEffect(() => {
    triggersApi.triggersList().then((triggers) => {
      setTriggers(triggers);
    });
  }, []);

  return (
    <DropdownButton
      id="triggers-dropdown"
      title={selectedTrigger ? selectedTrigger.name : "Select a trigger"}
      onSelect={(trigger_id) => {
        trigger_id && onChange(trigger_id);
      }}
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
