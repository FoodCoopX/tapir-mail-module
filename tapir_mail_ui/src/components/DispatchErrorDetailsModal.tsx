import React from "react";
import { Modal, Table } from "react-bootstrap";
import { EmailDispatch } from "../api_client";
import { formatDate } from "../utils/formatDate";

interface DispatchErrorDetailsModalProps {
  open: boolean;
  onClose: () => void;
  dispatches: EmailDispatch[];
  startDate: Date;
  endDate: Date;
}

const DispatchErrorDetailsModal: React.FC<DispatchErrorDetailsModalProps> = ({
  open,
  onClose,
  dispatches,
  startDate,
  endDate,
}) => {
  function renderDetails(dispatch: EmailDispatch) {
    switch (dispatch.dispatchStatus) {
      case "bounced":
        return (
          <span>
            Bounce-Typ "{dispatch.bounceType}" mit Nachricht :{" "}
            {dispatch.bounceMessage}
          </span>
        );
      case "error":
        return <span>{dispatch.errorMessage}</span>;
      case "opened":
        return <span>Geöffnet am {formatDate(dispatch.openedTime)}</span>;
      case "unknown":
        return <span></span>;
    }
  }

  return (
    <Modal
      show={open}
      onHide={onClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>Versand Fehler Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Details für {dispatches[0].recipient} zwischen {formatDate(startDate)}{" "}
        und {formatDate(endDate)}
        <hr />
        <Table
          striped
          hover
          style={{ margin: "0" }}
        >
          <thead>
            <tr>
              <th>Versand Datum</th>
              <th>Fehler Details</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.map((dispatch: EmailDispatch) => (
              <tr>
                <td>{formatDate(dispatch.sentTime)}</td>
                <td>{renderDetails(dispatch)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
};

export default DispatchErrorDetailsModal;
