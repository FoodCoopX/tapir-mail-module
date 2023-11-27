import React, { useEffect, useState } from "react";
import { Badge, Modal, Table } from "react-bootstrap";
import {
  EmailConfigurationDispatch,
  EmailDispatch,
  EmailDispatchApi,
} from "../api_client";
import { useApi } from "../hooks/useApi";
import { useAlert } from "../contexts/alerts";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import TapirPagination from "./TapirPagination";
import { EMAIL_DISPATCH_STATUS_PROPS } from "../utils/emailDispatchStatusProps";
import { formatDate } from "../utils/formatDate";

interface DispatchDetailsModalProps {
  configDispatch: EmailConfigurationDispatch;
  open: boolean;
  onClose: () => void;
}

const DispatchDetailsModal: React.FC<DispatchDetailsModalProps> = ({
  configDispatch,
  open,
  onClose,
}) => {
  const [dispatches, setDispatches] = useState<EmailDispatch[]>([]);
  const api = useApi(EmailDispatchApi);
  const showAlert = useAlert();
  const [currentPage, setCurrentPage] = useState(0);
  const [dispatchCount, setDispatchCount] = useState(0);

  useEffect(() => {
    api
      .emailDispatchList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
        configDispatchId: configDispatch.id,
      })
      .then((paginatedData) => {
        setDispatches(paginatedData.results ?? []);
        setDispatchCount(paginatedData.count ?? 0);
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Dispatches", "danger");
      });
  }, [configDispatch, currentPage]);

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
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Versand Details</Modal.Title>
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
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.map((dispatch) => (
              <tr>
                <td>{dispatch.recipient}</td>
                <td>
                  <Badge
                    bg={
                      EMAIL_DISPATCH_STATUS_PROPS[dispatch.dispatchStatus].color
                    }
                  >
                    {EMAIL_DISPATCH_STATUS_PROPS[dispatch.dispatchStatus].text}
                  </Badge>
                </td>
                <td>{renderDetails(dispatch)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <TapirPagination
          pageSize={DEFAULT_PAGE_SIZE}
          currentPage={currentPage}
          goToPage={setCurrentPage}
          itemCount={dispatchCount}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default DispatchDetailsModal;
