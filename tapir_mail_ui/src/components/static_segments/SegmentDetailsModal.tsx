import React from "react";
import { Modal, Table } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import {
  StaticSegment,
  StaticSegmentRecipient,
  StaticSegmentsApi,
} from "../../api_client";

interface SegmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  segment: StaticSegment;
}

const SegmentDetailsModal: React.FC<SegmentDetailsModalProps> = ({
  open,
  onClose,
  segment,
}) => {
  const staticSegmentApi = useApi(StaticSegmentsApi);
  const showAlert = useAlert();
  return (
    <>
      <Modal
        show={open}
        onHide={onClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Segment details: {segment.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table
            striped
            hover
            style={{ margin: "0" }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Adresse</th>
              </tr>
            </thead>
            <tbody>
              {segment.recipients.map((recipient: StaticSegmentRecipient) => (
                <tr>
                  <td>
                    {recipient.firstName} {recipient.lastName}
                  </td>
                  <td>{recipient.email}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SegmentDetailsModal;
