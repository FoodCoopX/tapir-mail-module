import React from "react";
import { Modal } from "react-bootstrap";
import TapirButton from "./TapirButton";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmDeleteModalProps {
  message: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  message,
  open,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      show={open}
      onHide={onCancel}
    >
      <Modal.Header closeButton>
        <Modal.Title>Löschen bestätigen</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <TapirButton
          variant="secondary"
          text="Abbrechen"
          icon={XMarkIcon}
          onClick={onCancel}
        />
        <TapirButton
          variant="danger"
          text="Löschen"
          icon={TrashIcon}
          onClick={onConfirm}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDeleteModal;
