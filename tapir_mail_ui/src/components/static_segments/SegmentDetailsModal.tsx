import React, { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import {
  StaticSegment,
  StaticSegmentApi,
  StaticSegmentRecipient,
} from "../../api_client";
import CreateRecipientModal from "./CreateRecipientModal";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

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
  const [createRecipientModalOpen, setCreateRecipientModalOpen] =
    useState(false);
  const staticSegmentApi = useApi(StaticSegmentApi);
  const [recipients, setRecipients] = useState<StaticSegmentRecipient[]>([]);

  useEffect(() => {
    if (!open) return;

    loadData();
  }, [open, segment]);

  function loadData() {
    if (!segment.id) return;

    staticSegmentApi
      .staticSegmentRetrieve({ id: segment.id })
      .then((updatedSegment) => {
        setRecipients(updatedSegment.recipients);
      });
  }

  return (
    <>
      <Modal
        show={open && !createRecipientModalOpen}
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
              {(recipients ? recipients : segment.recipients).map(
                (recipient: StaticSegmentRecipient) => (
                  <tr>
                    <td>
                      {recipient.firstName} {recipient.lastName}
                    </td>
                    <td>{recipient.email}</td>
                  </tr>
                ),
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end align-items-center">
          <TapirButton
            variant={"primary"}
            text={"Empfänger hinzufügen"}
            icon={PlusCircleIcon}
            onClick={() => setCreateRecipientModalOpen(true)}
          />
        </Modal.Footer>
      </Modal>
      <CreateRecipientModal
        open={createRecipientModalOpen}
        onClose={() => {
          setCreateRecipientModalOpen(false);
          loadData();
        }}
        segment={segment}
      />
    </>
  );
};

export default SegmentDetailsModal;
