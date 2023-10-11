import React from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { FloatingLabel, Form } from "react-bootstrap";
import DateTimePicker from "./dateTimePicker";

interface FormGroupProps {
  label: string;
  type: string;
  object: any;
  objectField: string;
}

const TapirMailFormGroup: React.FC<FormGroupProps> = ({
  label,
  type,
  object,
  objectField,
}) => {
  return (
    <Form.Group>
      {type === "datetime" ? (
        <>
          <Form.Label>{label}</Form.Label>
          <DateTimePicker
            initialValue={new Date(object[objectField] ?? null)}
            onChange={(date) => {
              object[objectField] = date;
            }}
          />
        </>
      ) : (
        <FloatingLabel label={label}>
          <Form.Control
            required={true}
            type={type}
            defaultValue={object[objectField]}
            onChange={(e) => {
              object[objectField] = e.target.value;
            }}
          />
        </FloatingLabel>
      )}
    </Form.Group>
  );
};

export default TapirMailFormGroup;
