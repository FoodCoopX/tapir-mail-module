import React, { useEffect, useRef, useState } from "react";
import { Form, Modal, Row } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { MailCategory, MailCategoryApi, ModeEnum } from "../../api_client";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { getModeDisplay } from "../../utils/getModeDisplay";

interface MailCategoryEditModalProps {
  open: boolean;
  onClose: () => void;
  category: MailCategory;
}

const MailCategoryEditModal: React.FC<MailCategoryEditModalProps> = ({
  open,
  onClose,
  category,
}) => {
  const [loading, setLoading] = useState(false);
  const mailCategoryApi = useApi(MailCategoryApi);
  const showAlert = useAlert();
  const [categoryName, setCategoryName] = useState("");
  const [categoryMode, setCategoryMode] = useState<ModeEnum>(ModeEnum.On);
  const [externalsEnabled, setExternalsEnabled] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      nameRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setCategoryName(category.name);
    setCategoryMode(category.mode);
    setExternalsEnabled(category.availableForExternalRecipients);
  }, [category]);

  function onSaveClicked() {
    setLoading(true);

    mailCategoryApi
      .mailCategoryUpdate({
        id: category.id!,
        mailCategoryRequest: {
          name: categoryName,
          mode: categoryMode,
          availableForExternalRecipients: externalsEnabled,
        },
      })
      .then(() => {
        onClose();
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Speichern der Kategorie", "danger");
      })
      .finally(() => setLoading(false));
  }

  return (
    <Modal
      show={open}
      onHide={onClose}
      size={"lg"}
    >
      <Modal.Header closeButton>
        <Modal.Title>Mail Kategorie erzeugen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              ref={nameRef}
              required={true}
              className={categoryName ? "" : "is-invalid"}
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </Form.Group>
        </Row>
        <Row className={"mt-2"}>
          <Form.Group>
            <Form.Label>Modus</Form.Label>
            <Form.Select
              value={categoryMode}
              onChange={(event) =>
                setCategoryMode(event.target.value as ModeEnum)
              }
            >
              {Object.values(ModeEnum).map((mode) => (
                <option
                  key={mode}
                  value={mode}
                >
                  {getModeDisplay(mode, true)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Row>
        <Row className={"mt-4"}>
          <Form.Group controlId={"externals"}>
            <Form.Check
              checked={externalsEnabled}
              onChange={(event) => setExternalsEnabled(event.target.checked)}
              label={
                "Können Nicht-Mitglieder sich für diese Kategorie anmelden?"
              }
            />
          </Form.Group>
        </Row>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-end align-items-center">
        <TapirButton
          variant={"primary"}
          text={loading ? "Loading..." : "Speichern"}
          icon={PlusCircleIcon}
          disabled={loading}
          onClick={() => onSaveClicked()}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default MailCategoryEditModal;
