import React, { useEffect, useState } from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import {
  TriggerDataRequest,
  TriggerDefinition,
  TriggersApi,
} from "../api_client";
import { useApi } from "../hooks/useApi";
import { Form } from "react-bootstrap";
import TapirMailFormGroup from "./TapirMailFormGroup";
import TapirDropdown from "./tapirDropdown";

interface TriggerInputProps {
  triggerData: TriggerDataRequest;
}

const TriggerInput: React.FC<TriggerInputProps> = ({ triggerData }) => {
  const triggersApi = useApi(TriggersApi);
  const [triggerDefinitions, setTriggerDefinitions] = useState<
    TriggerDefinition[]
  >([]);
  const selectedTriggerDefinition =
    triggerDefinitions.find(
      (trigger) => trigger.id === triggerData.triggerId,
    ) ?? triggerDefinitions[0];

  useEffect(() => {
    triggersApi.triggersList().then((triggerDefinitions) => {
      setTriggerDefinitions(triggerDefinitions);
    });
  }, []);

  function onDropdownSelect(triggerDefinition: TriggerDefinition | null) {
    if (!triggerDefinition) return;
    triggerData.triggerId = triggerDefinition?.id;
  }

  return (
    <>
      <Form.Group>
        <Form.Label>Trigger</Form.Label>
        <TapirDropdown
          choices={triggerDefinitions}
          onChoiceSelected={onDropdownSelect}
          selectedChoice={selectedTriggerDefinition}
        />
      </Form.Group>
      <br />
      {selectedTriggerDefinition &&
        selectedTriggerDefinition.fieldDefinitions.map((fieldDefinition) => (
          <>
            <TapirMailFormGroup
              label={fieldDefinition.label}
              type={fieldDefinition.type}
              value={triggerData.triggerData[fieldDefinition.fieldName]}
              onChange={(value) => {
                triggerData.triggerData[fieldDefinition.fieldName] = value;
              }}
            />
            <br />
          </>
        ))}
    </>
  );
};

export default TriggerInput;
