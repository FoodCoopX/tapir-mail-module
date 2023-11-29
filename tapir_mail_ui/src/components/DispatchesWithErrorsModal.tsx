import React, { useEffect, useState } from "react";
import { Form, Modal, Table } from "react-bootstrap";
import { EmailDispatchApi, GroupedEmailDispatch } from "../api_client";
import { useApi } from "../hooks/useApi";
import { useAlert } from "../contexts/alerts";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import TapirPagination from "./TapirPagination";
import DateTimePicker from "./dateTimePicker";
import DispatchErrorDetailsModal from "./DispatchErrorDetailsModal";

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
  const [startDate, setStartDate] = useState<Date | undefined>(
    getInitialStartDate(),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const emailDispatchApi = useApi(EmailDispatchApi);
  const showAlert = useAlert();
  const [selectedGroup, setSelectedGroup] = useState<GroupedEmailDispatch>();

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  function loadData() {
    console.log(startDate);
    emailDispatchApi
      .emailDispatchFailedDispatchesList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
        startDate: startDate,
        endDate: endDate,
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

  function getInitialStartDate() {
    let d = new Date();
    d.setFullYear(d.getFullYear() - 1, d.getMonth(), d.getDate());
    return d;
  }

  function getMinDate() {
    let d = new Date();
    d.setFullYear(d.getFullYear() - 5, d.getMonth(), d.getDate());
    return d;
  }

  return (
    <>
      <Modal
        show={open && !selectedGroup}
        onHide={onClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>E-Mail-Adressen mit Fehler</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={"d-flex gap-2"}>
            <Form.Group>
              <Form.Label>Von</Form.Label>
              <DateTimePicker
                onChange={setStartDate}
                initialValue={getInitialStartDate()}
                minDate={getMinDate()}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Bis</Form.Label>
              <DateTimePicker
                onChange={setEndDate}
                initialValue={new Date()}
                minDate={getMinDate()}
              />
            </Form.Group>
          </div>
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
                <tr
                  onClick={() => {
                    setSelectedGroup(group);
                  }}
                  style={{ cursor: "pointer" }}
                >
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
      {selectedGroup && (
        <DispatchErrorDetailsModal
          open={!!selectedGroup}
          onClose={() => setSelectedGroup(undefined)}
          dispatches={selectedGroup.dispatches}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
};

export default DispatchesWithErrorsModal;
