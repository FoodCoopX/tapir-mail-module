import React from "react";
import { Modal } from "react-bootstrap";
import TapirButton from "./TapirButton";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ButtonVariant } from "react-bootstrap/types";

interface ConfirmDeleteModalProps {
  message: string;
  title: string;
  open: boolean;
  confirmButtonText: string;
  confirmButtonVariant: ButtonVariant;
  confirmButtonIcon: React.ComponentType<{
    style: any;
  }>;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmDeleteModalProps> = ({
  message,
  title,
  open,
  confirmButtonText,
  confirmButtonVariant,
  confirmButtonIcon,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      show={open}
      onHide={onCancel}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
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
          variant={confirmButtonVariant}
          text={confirmButtonText}
          icon={confirmButtonIcon}
          onClick={onConfirm}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
