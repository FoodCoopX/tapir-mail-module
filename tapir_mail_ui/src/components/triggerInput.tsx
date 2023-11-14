import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import {
  TriggerDataRequest,
  TriggerDefinition,
  TriggersApi,
} from "../api_client";
import { useApi } from "../hooks/useApi";
import TapirMailFormGroup from "./TapirMailFormGroup";
import TapirDropdown from "./tapirDropdown";
import { MinusCircleIcon } from "@heroicons/react/24/outline";

interface TriggerInputProps {
  onTriggerIdSelected: (trigger_id: string | null) => void;
  onTriggerFieldValuesChanged: (triggerData: any) => void;
  triggerData: TriggerDataRequest;
  onTriggerDeleteClicked: () => void;
}

const TriggerInput: React.FC<TriggerInputProps> = ({
  onTriggerIdSelected,
  onTriggerFieldValuesChanged,
  triggerData,
  onTriggerDeleteClicked,
}) => {
  const triggersApi = useApi(TriggersApi);
  const [triggerDefinitions, setTriggerDefinitions] = useState<
    TriggerDefinition[]
  >([]);
  const selectedTriggerDefinition = triggerDefinitions.find(
    (trigger) => trigger.id === triggerData.triggerId,
  );

  useEffect(() => {
    triggersApi.triggersList().then((triggerDefinitions) => {
      setTriggerDefinitions(triggerDefinitions);
    });
  }, []);

  const onDropdownSelect = (triggerDefinition: TriggerDefinition | null) => {
    onTriggerIdSelected(triggerDefinition ? triggerDefinition.id : null);

    const defaultTriggerData: any = {};
    if (triggerDefinition) {
      triggerDefinition.fieldDefinitions.forEach((fieldDefinition) => {
        if (triggerData.triggerFieldValues[fieldDefinition.fieldName]) {
          defaultTriggerData[fieldDefinition.fieldName] =
            triggerData.triggerFieldValues[fieldDefinition.fieldName];
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

    onTriggerFieldValuesChanged(defaultTriggerData);
  };

  const handleTriggerDataChange = (fieldName: string, value: any) => {
    const newTriggerData = { ...triggerData };

    if (!selectedTriggerDefinition) return;

    const knownTriggerFields = selectedTriggerDefinition.fieldDefinitions.map(
      (fieldDefinition) => fieldDefinition.fieldName,
    );
    for (const key in newTriggerData.triggerFieldValues) {
      if (!knownTriggerFields.includes(key)) {
        delete newTriggerData.triggerFieldValues[key];
      }
    }

    newTriggerData.triggerFieldValues[fieldName] = value;
    onTriggerFieldValuesChanged(newTriggerData.triggerFieldValues);
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-neutral-2)",
        padding: "1em",
        marginLeft: "-0.5em",
        marginRight: "-0.5em",
        borderRadius: "6px",
        border: "1px solid var(--color-neutral-3)",
      }}
    >
      <Form.Group className="d-flex justify-content-center">
        <TapirDropdown
          choices={triggerDefinitions}
          onChoiceSelected={onDropdownSelect}
          selectedChoice={selectedTriggerDefinition}
        />
        <MinusCircleIcon
          color="red"
          onClick={onTriggerDeleteClicked}
          width="3em"
        />
      </Form.Group>
      <br />
      {selectedTriggerDefinition &&
        selectedTriggerDefinition.fieldDefinitions.map((fieldDefinition) => (
          <TapirMailFormGroup
            key={fieldDefinition.fieldName}
            label={fieldDefinition.label}
            type={fieldDefinition.type}
            value={triggerData.triggerFieldValues[fieldDefinition.fieldName]}
            additionalData={fieldDefinition.additionalData}
            onChange={(value) => {
              handleTriggerDataChange(fieldDefinition.fieldName, value);
            }}
          />
        ))}
    </div>
  );
};

export default TriggerInput;
