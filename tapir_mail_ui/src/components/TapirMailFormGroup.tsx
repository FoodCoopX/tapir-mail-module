import React from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Form } from "react-bootstrap";
import DateTimePicker from "./dateTimePicker";

interface FormGroupProps {
  label: string;
  type: string;
  value: any;
  onChange: (newValue: any) => void;
}

const TapirMailFormGroup: React.FC<FormGroupProps> = ({
  label,
  type,
  value,
  onChange,
}) => {
  function renderInput() {
    switch (type) {
      case "datetime":
        return (
          <DateTimePicker
            initialValue={value ? new Date(value) : new Date(Date.now())}
            onChange={onChange}
          />
        );
      case "checkbox":
        return (
          <Form.Check
            onChange={onChange}
            defaultChecked={value}
          />
        );
      default:
        return (
          <Form.Control
            required={true}
            type={type}
            defaultValue={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />
        );
    }
  }

  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      {renderInput()}
    </Form.Group>
  );
};

export default TapirMailFormGroup;
