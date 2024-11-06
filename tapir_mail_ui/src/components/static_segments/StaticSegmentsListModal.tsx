import React, { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import Loading from "./../loading";
import { StaticSegment, StaticSegmentApi } from "../../api_client";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import StaticSegmentsCreateModal from "./StaticSegmentsCreateModal";
import SegmentDetailsModal from "./SegmentDetailsModal";

interface StaticSegmentsListModalProps {
  open: boolean;
  onClose: () => void;
}

const StaticSegmentsListModal: React.FC<StaticSegmentsListModalProps> = ({
  open,
  onClose,
}) => {
  const [staticSegments, setStaticSegments] = useState<StaticSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<StaticSegment>();
  const staticSegmentApi = useApi(StaticSegmentApi);
  const showAlert = useAlert();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  function loadData() {
    if (!open) return;

    setLoading(true);

    staticSegmentApi
      .staticSegmentList()
      .then(setStaticSegments)
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Segmente", "danger");
      })
      .finally(() => setLoading(false));
  }

  return (
    <>
      <Modal
        show={open && !createModalOpen && !selectedSegment}
        onHide={onClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Statische Segmente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <Loading />
          ) : (
            <Table
              striped
              hover
              style={{ margin: "0" }}
            >
              <thead>
                <tr>
                  <th>Segment-Name</th>
                  <th>Anzahl an Adressen</th>
                </tr>
              </thead>
              <tbody>
                {staticSegments.map((segment: StaticSegment) => (
                  <tr
                    key={segment.id}
                    onClick={() => {
                      setSelectedSegment(segment);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{segment.name}</td>
                    <td>{segment.recipients.length}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end align-items-center">
          <TapirButton
            variant={"primary"}
            text={"Segment hinzufügen"}
            icon={PlusCircleIcon}
            onClick={() => setCreateModalOpen(true)}
          />
        </Modal.Footer>
      </Modal>
      <StaticSegmentsCreateModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          loadData();
        }}
      />
      {selectedSegment && (
        <SegmentDetailsModal
          open={!!selectedSegment}
          onClose={() => {
            setSelectedSegment(undefined);
            loadData();
          }}
          segment={selectedSegment}
        />
      )}
    </>
  );
};

export default StaticSegmentsListModal;
