import React, { useEffect, useState } from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Trigger, TriggersApi } from "../api_client";
import { useApi } from "../hooks/useApi";
import { Form } from "react-bootstrap";
import TapirMailFormGroup from "./TapirMailFormGroup";
import TapirDropdown from "./tapirDropdown";

interface TriggerInputProps {
  selectedTriggerId: string | null;
  onTriggerSelected: (trigger_id: string | null) => void;
  triggerData: any;
}

const TriggerInput: React.FC<TriggerInputProps> = ({
  selectedTriggerId,
  onTriggerSelected,
  triggerData,
}) => {
  const triggersApi = useApi(TriggersApi);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const selectedTrigger =
    triggers.find((trigger) => trigger.id === selectedTriggerId) ?? triggers[0];

  useEffect(() => {
    triggersApi.triggersList().then((triggers) => {
      setTriggers(triggers);
      if (!selectedTriggerId) {
        onDropdownSelect(triggers[0]);
      }
    });
  }, []);

  function onDropdownSelect(trigger: Trigger | null) {
    onTriggerSelected(trigger ? trigger.id : null);
  }

  return (
    <>
      <Form.Group>
        <Form.Label>Trigger</Form.Label>
        <TapirDropdown
          choices={triggers}
          onChoiceSelected={onDropdownSelect}
          selectedChoice={selectedTrigger}
        />
      </Form.Group>
      <br />
      {selectedTrigger &&
        selectedTrigger.fieldDefinitions.map((fieldDefinition) => (
          <>
            <TapirMailFormGroup
              label={fieldDefinition.label}
              type={fieldDefinition.type}
              value={triggerData[fieldDefinition.fieldName]}
              onChange={(value) => {
                triggerData[fieldDefinition.fieldName] = value;
              }}
            />
            <br />
          </>
        ))}
    </>
  );
};

export default TriggerInput;
