import { HomeIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import React, { ReactNode, useEffect, useState } from "react";
import { Button, Card, Modal, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  EmailConfiguration,
  EmailConfigurationApi,
  EmailConfigurationVersion,
  EmailConfigurationVersionApi,
} from "../../api_client";
import EmailConfigurationVersionSelect from "../../components/emailConfigurationVersionSelect";
import EmailConfigurationVersionStatusBadge from "../../components/emailConfigurationVersionStatusBadge";
import EmailInput from "../../components/emailInput";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { formatDate } from "../../utils/formatDate";

const MailPlanningOverview = () => {
  const api = useApi(EmailConfigurationApi);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmailConfiguration, setSelectedEmailConfiguration] = useState<
    EmailConfiguration | undefined
  >(undefined);

  const handleCloseEditModal = () => setEditModalOpen(false);
  const handleSelectEmailConfiguration = (ec: EmailConfiguration) => {
    setSelectedEmailConfiguration(ec);
    setEditModalOpen(true);
  };

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          margin: "1em",
        }}
      >
        <Link to={Paths.dashboard}>
          <Button variant="outline-primary">
            <HomeIcon width={18} />
            &nbsp;&nbsp;Dashboard
          </Button>
        </Link>
        <h3>
          <strong>Geplante Emails</strong>
        </h3>
        <Link to={Paths.emailConfigurationCreate}>
          <Button variant="success">
            <PlusCircleIcon width={20} />
            &nbsp;&nbsp;Neu anlegen
          </Button>
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridGap: "1em",
        }}
      >
        <EmailConfigurationTable
          title={<EmailConfigurationVersionStatusBadge status="released" />}
          apiCall={() => api.emailConfigurationReleasedList()}
          onSelectEmailConfiguration={handleSelectEmailConfiguration}
        />
        <EmailConfigurationTable
          title={<EmailConfigurationVersionStatusBadge status="draft" />}
          apiCall={() => api.emailConfigurationList()}
          onSelectEmailConfiguration={handleSelectEmailConfiguration}
        />

        <SelectVersionModal
          open={editModalOpen}
          emailConfiguration={selectedEmailConfiguration!!}
          onClose={handleCloseEditModal}
        />
      </div>
    </div>
  );
};

const EmailConfigurationTable = ({
  title,
  apiCall,
  onSelectEmailConfiguration,
}: {
  title: string | ReactNode;
  apiCall: () => Promise<EmailConfiguration[]>;
  onSelectEmailConfiguration: (ec: EmailConfiguration) => void;
}) => {
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [emailConfigurations, setEmailConfigurations] = useState<
    EmailConfiguration[]
  >([]);

  useEffect(() => {
    apiCall()
      .then((data) => {
        setEmailConfigurations(data);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <Card.Header>
        <h5>{title}</h5>
      </Card.Header>
      <Card.Body style={{ padding: 0 }}>
        {loading ? (
          <Loading />
        ) : (
          <Table
            striped
            bordered
            hover
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {emailConfigurations.map((ec) => (
                <tr
                  key={ec.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectEmailConfiguration(ec)}
                >
                  <td>{ec.name}</td>
                  <td>{formatDate(ec.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

const SelectVersionModal = ({
  emailConfiguration,
  open,
  onClose,
}: {
  emailConfiguration: EmailConfiguration;
  open: boolean;
  onClose: () => void;
}) => {
  const configApi = useApi(EmailConfigurationApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [versions, setVersions] = useState<EmailConfigurationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  useEffect(() => {
    if (emailConfiguration) {
      configApi
        .emailConfigurationVersionsList({
          id: emailConfiguration!!.id!!,
        })
        .then((data) => {
          setVersions(data);
          data.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          setSelectedVersionId(data[0].id!!);
        })
        .catch((err) => {
          console.error(err);
          showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
        });
    }
  }, [emailConfiguration]);

  const handleCloseSendModal = () => setSendModalOpen(false);
  const handleEdit = () => {
    onClose();
    navigate(Paths.emailConfigurationEdit.replace(":id", selectedVersionId));
  };

  return (
    <>
      <Modal
        show={Boolean(open) && !sendModalOpen}
        onHide={onClose}
        dialogClassName="preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Email Konfiguration editieren</Modal.Title>
        </Modal.Header>
        {emailConfiguration && (
          <Modal.Body>
            Welche Version möchtest du editieren?
            <br />
            <EmailConfigurationVersionSelect
              preview={true}
              versions={versions}
              selectedVersionId={selectedVersionId}
              onChange={(id: string) => setSelectedVersionId(id)}
            />
          </Modal.Body>
        )}
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            variant="success"
            onClick={onClose}
          >
            Abbrechen
          </Button>
          <div>
            <Button
              variant="warning"
              onClick={() => setSendModalOpen(true)}
              style={{ marginRight: "1em" }}
            >
              Testmail senden
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
            >
              Editieren
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      <SendTestMailModal
        open={sendModalOpen}
        emailConfigurationVersion={selectedVersion!!}
        onClose={handleCloseSendModal}
      />
    </>
  );
};

const SendTestMailModal = ({
  emailConfigurationVersion,
  open,
  onClose,
}: {
  emailConfigurationVersion: EmailConfigurationVersion;
  open: boolean;
  onClose: () => void;
}) => {
  const versionApi = useApi(EmailConfigurationVersionApi);
  const showAlert = useAlert();

  const [recipients, setRecipients] = useState<string[]>([]);
  const handleRecipientsChange = (emails: string[]) => {
    setRecipients(emails);
  };

  const handleSendEmail = () => {
    onClose();
    versionApi
      .emailConfigurationVersionSendTestEmail({
        id: emailConfigurationVersion.id!!,
        recipient: { recipients: recipients },
      })
      .then(() => {
        showAlert("Test-Email wurde versendet!", "success");
      })
      .catch((err) => {
        console.error(err);
        showAlert("Beim Versenden ist ein Fehler aufgetreten.", "danger");
      });
  };

  return (
    <Modal
      show={Boolean(open)}
      onHide={onClose}
      dialogClassName="preview-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Testmail senden</Modal.Title>
      </Modal.Header>
      {emailConfigurationVersion && (
        <Modal.Body>
          Möchtest du die Email&nbsp;
          <strong>{emailConfigurationVersion?.emailConfiguration?.name}</strong>
          &nbsp; als Testmail versenden?
          <br />
          <EmailInput onEmailListChange={handleRecipientsChange} />
        </Modal.Body>
      )}
      <Modal.Footer
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <Button
          variant="success"
          onClick={onClose}
        >
          Abbrechen
        </Button>
        <Button
          variant={recipients.length > 0 ? "primary" : "disabled"}
          onClick={handleSendEmail}
          disabled={recipients.length === 0}
        >
          Email senden
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MailPlanningOverview;
