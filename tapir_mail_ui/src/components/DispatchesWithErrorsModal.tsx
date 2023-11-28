import React, { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import { EmailDispatchApi, GroupedEmailDispatch } from "../api_client";
import { useApi } from "../hooks/useApi";
import { useAlert } from "../contexts/alerts";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import TapirPagination from "./TapirPagination";

interface DispatchesWithErrorsModalProps {
  open: boolean;
  onClose: () => void;
}

const DispatchesWithErrorsModal: React.FC<DispatchesWithErrorsModalProps> = ({
  open,
  onClose,
}) => {
  const [groupedDispatches, setGroupedDispatches] = useState<
    GroupedEmailDispatch[]
  >([]);
  const [groupCount, setGroupCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const emailDispatchApi = useApi(EmailDispatchApi);
  const showAlert = useAlert();

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    emailDispatchApi
      .emailDispatchFailedDispatchesList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
      })
      .then((paginatedData) => {
        let sortedGroups = paginatedData.results ?? [];
        sortedGroups.sort((a, b) => {
          return b.dispatches.length - a.dispatches.length;
        });
        setGroupedDispatches(sortedGroups);
        setGroupCount(paginatedData.count ?? 0);
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Dispatches", "danger");
      });
  }

  return (
    <Modal
      show={open}
      onHide={onClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>E-Mail-Adressen mit Fehler</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table
          striped
          hover
          style={{ margin: "0" }}
        >
          <thead>
            <tr>
              <th>Adresse</th>
              <th>Anzahl an Fehler</th>
            </tr>
          </thead>
          <tbody>
            {groupedDispatches.map((group) => (
              <tr>
                <td>{group.dispatches[0].recipient}</td>
                <td>{group.dispatches.length}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      {groupCount > DEFAULT_PAGE_SIZE && (
        <Modal.Footer className="d-flex justify-content-center align-items-center">
          <TapirPagination
            pageSize={DEFAULT_PAGE_SIZE}
            currentPage={currentPage}
            goToPage={setCurrentPage}
            itemCount={groupCount}
          />
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default DispatchesWithErrorsModal;
