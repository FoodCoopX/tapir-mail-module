import React, { useState } from "react";
import { Form, Modal } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { StaticSegment, StaticSegmentRecipientApi } from "../../api_client";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface CreateRecipientModalProps {
  open: boolean;
  onClose: () => void;
  segment: StaticSegment;
}

const CreateRecipientModal: React.FC<CreateRecipientModalProps> = ({
  open,
  onClose,
  segment,
}) => {
  const [loading, setLoading] = useState(false);
  const recipientApi = useApi(StaticSegmentRecipientApi);
  const showAlert = useAlert();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  function onCreateClicked() {
    setLoading(true);

    recipientApi
      .staticSegmentRecipientCreate({
        staticSegmentRecipientRequest: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          segment: segment.id!,
        },
      })
      .then(() => {
        onClose();
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim erzeugen der Segment", "danger");
      })
      .finally(() => setLoading(false));
  }

  return (
    <Modal
      show={open}
      onHide={onClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>Empfänger zu {segment.name} hinzufügen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label column={"lg"}>Vorname</Form.Label>
            <Form.Control
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label column={"lg"}>Nachname</Form.Label>
            <Form.Control
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label column={"lg"}>Email-Adresse</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-end align-items-center">
        <TapirButton
          variant={"primary"}
          text={loading ? "Loading..." : "Hinzufügen"}
          icon={PlusCircleIcon}
          disabled={loading}
          onClick={() => onCreateClicked()}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default CreateRecipientModal;
