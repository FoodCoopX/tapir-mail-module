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
import TapirDropdown, { Choice } from "./tapirDropdown";
import EmailConfigurationDispatchStats from "./dashboard/EmailConfigurationDispatchStats";

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
  const [statusFilter, setStatusFilter] = useState<Choice>();

  const filterChoices = [];
  let key: keyof typeof EMAIL_DISPATCH_STATUS_PROPS;
  for (key in EMAIL_DISPATCH_STATUS_PROPS) {
    filterChoices.push({
      id: key,
      name: EMAIL_DISPATCH_STATUS_PROPS[key].text,
    });
  }

  useEffect(() => {
    api
      .emailDispatchList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
        configDispatchId: configDispatch.id,
        dispatchStatus: statusFilter?.id.toString(),
      })
      .then((paginatedData) => {
        setDispatches(paginatedData.results ?? []);
        setDispatchCount(paginatedData.count ?? 0);
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Dispatches", "danger");
      });
  }, [configDispatch, currentPage, statusFilter]);

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
        <Modal.Title>
          Versand Details : "
          {configDispatch.emailConfigurationVersion.emailConfiguration.name}"
          gesendet am {formatDate(configDispatch.scheduledTime)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center">
          <TapirDropdown
            choices={filterChoices}
            onChoiceSelected={(choice) => {
              setStatusFilter(choice ?? undefined);
            }}
            selectedChoice={statusFilter}
            noSelectionText="Per Status filtern"
          ></TapirDropdown>
          <EmailConfigurationDispatchStats
            emailConfigurationDispatch={configDispatch}
          />
        </div>
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
      {dispatchCount > DEFAULT_PAGE_SIZE && (
        <Modal.Footer className="d-flex justify-content-center align-items-center">
          <TapirPagination
            pageSize={DEFAULT_PAGE_SIZE}
            currentPage={currentPage}
            goToPage={setCurrentPage}
            itemCount={dispatchCount}
          />
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default DispatchDetailsModal;
