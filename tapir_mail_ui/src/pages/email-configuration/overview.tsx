import React, { useLayoutEffect, useState } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { EmailConfiguration, EmailConfigurationApi } from "../../api_client";
import EmailInput from "../../components/EmailInput";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";

const MailPlanningOverview = () => {
  const api = useApi(EmailConfigurationApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [emailConfigurations, setEmailConfigurations] = useState<
    EmailConfiguration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedEmailConfiguration, setSelectedEmailConfiguration] = useState<
    EmailConfiguration | undefined
  >(undefined);

  useLayoutEffect(() => {
    api
      .emailconfigurationsList()
      .then((data) => {
        setEmailConfigurations(data);
      })
      .catch((err) => {
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCloseModal = () => setSendModalOpen(false);
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
          <Button variant="secondary">Zurück</Button>
        </Link>
        <h3>
          <strong>Geplante Emails</strong>
        </h3>
        <Link to={Paths.emailConfigurationCreate}>
          <Button>Neu anlegen</Button>
        </Link>
      </div>
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
              <th>Subject</th>
              <th>Template</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {emailConfigurations.map((ec) => (
              <tr
                key={ec.id}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(Paths.emailConfigurationEdit.replace(":id", ec.id!!))
                }
              >
                <td>{ec.name}</td>
                <td>{ec.subject}</td>
                <td>{ec.template}</td>
                <td>{ec.createdAt.toISOString()}</td>
                <td>{ec.updatedAt.toISOString()}</td>
                <td
                  onClick={(e) => {
                    e.stopPropagation();
                    setSendModalOpen(true);
                    setSelectedEmailConfiguration(ec);
                  }}
                >
                  <Button
                    size="sm"
                    variant="warning"
                  >
                    Senden
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <SendTestMailModal
        open={sendModalOpen}
        emailConfiguration={selectedEmailConfiguration!!}
        onClose={handleCloseModal}
      />
    </div>
  );
};

const SendTestMailModal = ({
  emailConfiguration,
  open,
  onClose,
}: {
  emailConfiguration: EmailConfiguration;
  open: boolean;
  onClose: () => void;
}) => {
  const api = useApi(EmailConfigurationApi);
  const showAlert = useAlert();

  const [recipients, setRecipients] = useState<string[]>([]);
  const handleRecipientsChange = (emails: string[]) => {
    setRecipients(emails);
  };

  const handleSendEmail = () => {
    onClose();
    api
      .emailconfigurationsSendTestEmail({
        id: emailConfiguration!!.id!!,
        recipient: { recipients: recipients },
      })
      .then(() => {
        showAlert("Email wurde versendet!", "success");
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
    >
      <Modal.Header closeButton>
        <Modal.Title>Testemail senden</Modal.Title>
      </Modal.Header>
      {emailConfiguration && (
        <Modal.Body>
          Möchtest du die Email <strong>{emailConfiguration!!.name}</strong> als
          Testmail versenden?
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
