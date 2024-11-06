import React, { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import TapirPagination from "../TapirPagination";
import Loading from "./../loading";
import { StaticSegment, StaticSegmentsApi } from "../../api_client";
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
  const [segmentCount, setSegmentCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<StaticSegment>();
  const staticSegmentApi = useApi(StaticSegmentsApi);
  const showAlert = useAlert();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, currentPage]);

  function loadData() {
    if (!open) return;

    setLoading(true);

    staticSegmentApi
      .staticSegmentsList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
      })
      .then((paginatedData) => {
        setStaticSegments(paginatedData.results ?? []);
        setSegmentCount(paginatedData.count ?? 0);
      })
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
          <TapirButton
            variant={"primary"}
            text={"Segment hinzufügen"}
            icon={PlusCircleIcon}
            onClick={() => setCreateModalOpen(true)}
          />
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
        {segmentCount > DEFAULT_PAGE_SIZE && (
          <Modal.Footer className="d-flex justify-content-center align-items-center">
            <TapirPagination
              pageSize={DEFAULT_PAGE_SIZE}
              currentPage={currentPage}
              goToPage={setCurrentPage}
              itemCount={segmentCount}
            />
          </Modal.Footer>
        )}
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
          onClose={() => setSelectedSegment(undefined)}
          segment={selectedSegment}
        />
      )}
    </>
  );
};

export default StaticSegmentsListModal;
