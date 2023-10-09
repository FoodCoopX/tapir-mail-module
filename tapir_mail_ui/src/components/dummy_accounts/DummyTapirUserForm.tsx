import React from "react";
import { Button, Form } from "react-bootstrap";
import TapirMailFormGroup from "../TapirMailFormGroup";
import { DummyTapirUser } from "../../api_client";

interface DummyTapirUserFormProps {
  user: DummyTapirUser;
  onSave: () => void;
}

const DummyTapirUserForm: React.FC<DummyTapirUserFormProps> = ({
  user,
  onSave,
}) => {
  interface FormGroupProps {
    label: string;
    type: string;
    field: string;
  }

  const formGroups: FormGroupProps[] = [
    { label: "E-Mail", type: "email", field: "email" },
    { label: "First name", type: "text", field: "firstName" },
    { label: "Last name", type: "text", field: "lastName" },
  ];
  return (
    <Form style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {formGroups.map((formGroup) => (
        <TapirMailFormGroup
          label={formGroup.label}
          type={formGroup.type}
          object={user}
          objectField={formGroup.field}
        />
      ))}
      <Button
        variant="primary"
        onClick={onSave}
      >
        Save
      </Button>
    </Form>
  );
};

export default DummyTapirUserForm;
