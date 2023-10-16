import React from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { FloatingLabel, Form } from "react-bootstrap";
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
  return (
    <Form.Group>
      {type === "datetime" ? (
        <>
          <Form.Label>{label}</Form.Label>
          <DateTimePicker
            initialValue={value ? new Date(value) : new Date(Date.now())}
            onChange={onChange}
          />
        </>
      ) : (
        <FloatingLabel label={label}>
          <Form.Control
            required={true}
            type={type}
            defaultValue={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />
        </FloatingLabel>
      )}
    </Form.Group>
  );
};

export default TapirMailFormGroup;
