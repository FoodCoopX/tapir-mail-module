import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { Trigger, TriggersApi } from "../api_client";
import { useApi } from "../hooks/useApi";
import TapirMailFormGroup from "./TapirMailFormGroup";
import TapirDropdown from "./tapirDropdown";

interface TriggerInputProps {
  selectedTriggerId: string | null;
  onTriggerSelected: (trigger_id: string | null) => void;
  onTriggerDataChange: (triggerData: any) => void;
  triggerData: any;
}

const TriggerInput: React.FC<TriggerInputProps> = ({
  selectedTriggerId,
  onTriggerSelected,
  onTriggerDataChange,
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

  const onDropdownSelect = (trigger: Trigger | null) => {
    onTriggerSelected(trigger ? trigger.id : null);

    const defaultTriggerData: any = {};
    if (trigger) {
      trigger.fieldDefinitions.forEach((fieldDefinition) => {
        if (triggerData[fieldDefinition.fieldName]) {
          defaultTriggerData[fieldDefinition.fieldName] =
            triggerData[fieldDefinition.fieldName];
          return;
        }

        switch (fieldDefinition.type) {
          case "datetime":
            defaultTriggerData[fieldDefinition.fieldName] = new Date();
            break;
          case "checkbox":
            defaultTriggerData[fieldDefinition.fieldName] = false;
            break;
          case "dropdown":
            defaultTriggerData[fieldDefinition.fieldName] =
              fieldDefinition.additionalData?.choices[0].value;
            break;
          case "number":
            defaultTriggerData[fieldDefinition.fieldName] = 0;
            break;
        }
      });
    }

    onTriggerDataChange(defaultTriggerData);
  };

  const handleTriggerDataChange = (fieldName: string, value: any) => {
    const newTriggerData = { ...triggerData };

    const knownTriggerFields = selectedTrigger.fieldDefinitions.map(
      (fieldDefinition) => fieldDefinition.fieldName,
    );
    for (const key in newTriggerData) {
      if (!knownTriggerFields.includes(key)) {
        delete newTriggerData[key];
      }
    }

    newTriggerData[fieldName] = value;
    onTriggerDataChange(newTriggerData);
  };

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
          <TapirMailFormGroup
            key={fieldDefinition.fieldName}
            label={fieldDefinition.label}
            type={fieldDefinition.type}
            value={triggerData[fieldDefinition.fieldName]}
            additionalData={fieldDefinition.additionalData}
            onChange={(value) => {
              handleTriggerDataChange(fieldDefinition.fieldName, value);
            }}
          />
        ))}
    </>
  );
};

export default TriggerInput;
