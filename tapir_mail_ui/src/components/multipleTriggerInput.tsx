import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import React from "react";
import { TriggerDataRequest } from "../api_client";
import TriggerInput from "./triggerInput";
import { Form } from "react-bootstrap";
import TapirButton from "./TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface MultipleTriggerInputProps {
  initialTriggers: TriggerDataRequest[];
  onChange: (triggers: TriggerDataRequest[]) => void;
}

const MultipleTriggerInput: React.FC<MultipleTriggerInputProps> = ({
  initialTriggers,
  onChange,
}) => {
  const addNewTrigger = () => {
    onChange(
      initialTriggers.concat([{ triggerId: "", triggerFieldValues: {} }]),
    );
  };

  function onTriggerIdSelected(index: number, triggerId: string | null) {
    if (!triggerId) return;

    let newTriggers = [...initialTriggers];
    newTriggers[index].triggerId = triggerId;
    onChange(newTriggers);
  }

  function onTriggerFieldValuesChanged(index: number, fieldValues: any) {
    let newTriggers = [...initialTriggers];
    newTriggers[index].triggerFieldValues = fieldValues;
    onChange(newTriggers);
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-neutral-1)",
        padding: "1em",
        marginLeft: "-0.5em",
        marginRight: "-0.5em",
        borderRadius: "6px",
        border: "1px solid var(--color-neutral-3)",
      }}
      className="d-flex flex-column gap-2"
    >
      <Form.Label>Triggers</Form.Label>
      {initialTriggers.map((trigger, index) => (
        <TriggerInput
          key={index}
          onTriggerIdSelected={(triggerId) => {
            onTriggerIdSelected(index, triggerId);
          }}
          onTriggerFieldValuesChanged={(fieldValues) => {
            onTriggerFieldValuesChanged(index, fieldValues);
          }}
          triggerData={trigger}
        />
      ))}
      <TapirButton
        variant={"success"}
        text={"Trigger hinzufügen"}
        icon={PlusCircleIcon}
        onClick={addNewTrigger}
      />
    </div>
  );
};

export default MultipleTriggerInput;
