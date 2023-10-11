import React, { useEffect, useState } from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Trigger, TriggersApi } from "../api_client";
import { useApi } from "../hooks/useApi";
import TriggerDropdown from "./triggerDropdown";
import { Form } from "react-bootstrap";
import TapirMailFormGroup from "./TapirMailFormGroup";

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
  const selectedTrigger = triggers.find(
    (trigger) => trigger.id === selectedTriggerId,
  );

  useEffect(() => {
    triggersApi.triggersList().then((triggers) => {
      setTriggers(triggers);
    });
  }, []);

  function onDropdownSelect(trigger_id: string | null) {
    const selectedTrigger = triggers.find(
      (trigger) => trigger.id === trigger_id,
    );
    onTriggerSelected(selectedTrigger ? selectedTrigger.id : null);
  }

  return (
    <>
      <Form.Group>
        <Form.Label>Trigger</Form.Label>
        <TriggerDropdown
          triggers={triggers}
          selectedTriggerId={selectedTrigger ? selectedTrigger.id : null}
          onTriggerSelected={onDropdownSelect}
        />
      </Form.Group>
      <br />
      {selectedTrigger &&
        selectedTrigger.fieldDefinitions.map((fieldDefinition) => (
          <>
            <TapirMailFormGroup
              label={fieldDefinition.label}
              type={fieldDefinition.type}
              object={triggerData}
              objectField={fieldDefinition.fieldName}
            />
            <br />
          </>
        ))}
    </>
  );
};

export default TriggerInput;
