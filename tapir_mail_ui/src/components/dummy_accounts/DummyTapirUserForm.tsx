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
  return (
    <Form>
      <TapirMailFormGroup
        label="E-Mail"
        type="email"
        object={user}
        objectField="email"
      />
      <TapirMailFormGroup
        label="First name"
        type="text"
        object={user}
        objectField="firstName"
      />
      <TapirMailFormGroup
        label="Last name"
        type="text"
        object={user}
        objectField="lastName"
      />
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
