import React from "react";
import { Modal } from "react-bootstrap";
import { MissingTrigger } from "../../api_client";

interface MissingTriggersModalProps {
  open: boolean;
  onHide: () => void;
  missingTriggers: MissingTrigger[];
}

const ConfirmModal: React.FC<MissingTriggersModalProps> = ({
  open,
  onHide,
  missingTriggers,
}) => {
  return (
    <Modal
      show={open}
      onHide={onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>Fehlende Trigger</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Es würden keine veröffentlichte Mail gefunden was folgende Trigger
          einsetzt. Ohne diese Trigger können die betroffene Funktionalitäten
          nicht richtig funktionieren.
        </p>
        <p>
          Hier können sie Mail-Entwürfe erzeugen mit der passende Trigger und
          Standard-Inhalte
        </p>
        <ul>
          {missingTriggers.map((trigger) => (
            <li>{trigger.name}</li>
          ))}
        </ul>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmModal;
