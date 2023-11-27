import React, { useEffect, useState } from "react";
import { Badge, Modal, Table } from "react-bootstrap";
import {
  DispatchStatusEnum,
  EmailConfigurationDispatch,
  EmailConfigurationDispatchApi,
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
import TapirButton from "./TapirButton";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

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
  const emailDispatchApi = useApi(EmailDispatchApi);
  const emailConfigDispatchApi = useApi(EmailConfigurationDispatchApi);
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
    loadData();
  }, [configDispatch, currentPage, statusFilter]);

  function loadData() {
    emailDispatchApi
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
  }

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

  function retryConfigDispatch() {
    emailConfigDispatchApi
      .emailConfigurationDispatchRetryallCreate({
        id: configDispatch.id!,
        emailConfigurationDispatchRequest: configDispatch,
      })
      .then(() => {
        loadData();
        showAlert("Email wird erneut versendet.", "success");
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim erneutem Versand!", "danger");
      });
  }

  function retrySingleDispatch(dispatch: EmailDispatch) {
    emailDispatchApi
      .emailDispatchRetryCreate({
        id: dispatch.id!,
        emailDispatchRequest: dispatch,
      })
      .then(() => {
        loadData();
        showAlert("Email wird erneut versendet.", "success");
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim erneutem Versand!", "danger");
      });
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
          <TapirButton
            variant={
              configDispatch.errorCount === 0
                ? "outline-secondary"
                : "outline-primary"
            }
            icon={ArrowPathIcon}
            text={"Alle Fehler erneut versuchen"}
            disabled={configDispatch.errorCount === 0}
            onClick={retryConfigDispatch}
          />
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
              <th></th>
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
                <td>
                  {dispatch.dispatchStatus != DispatchStatusEnum.Opened &&
                    dispatch.dispatchStatus != DispatchStatusEnum.Unknown &&
                    (!dispatch.nextRetry ? (
                      <TapirButton
                        variant={"outline-primary"}
                        text="Erneut versenden"
                        icon={ArrowPathIcon}
                        onClick={() => retrySingleDispatch(dispatch)}
                      />
                    ) : (
                      <span>Dies ist schon erneut versendet worden.</span>
                    ))}
                </td>
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
