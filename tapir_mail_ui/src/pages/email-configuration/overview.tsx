import React, { useEffect, useLayoutEffect, useState } from "react";
import { Badge, Button, Dropdown, Form, Modal, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  EmailConfiguration,
  EmailConfigurationApi,
  EmailConfigurationVersion,
  EmailConfigurationVersionApi,
} from "../../api_client";
import EmailInput from "../../components/EmailInput";
import HtmlInDiv from "../../components/htmlInDiv";
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmailConfiguration, setSelectedEmailConfiguration] = useState<
    EmailConfiguration | undefined
  >(undefined);

  useLayoutEffect(() => {
    api
      .emailConfigurationList()
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

  const handleCloseSendModal = () => setSendModalOpen(false);
  const handleCloseEditModal = () => setEditModalOpen(false);
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
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {emailConfigurations.map((ec) => (
              <tr
                key={ec.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedEmailConfiguration(ec);
                  setEditModalOpen(true);
                }}
              >
                <td>{ec.name}</td>
                <td>{ec.createdAt.toISOString()}</td>
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
      <SelectVersionModal
        open={editModalOpen}
        emailConfiguration={selectedEmailConfiguration!!}
        onClose={handleCloseEditModal}
      />
      <SendTestMailModal
        open={sendModalOpen}
        emailConfiguration={selectedEmailConfiguration!!}
        onClose={handleCloseSendModal}
      />
    </div>
  );
};

const EmailConfigurationVersionSelect = ({
  versions,
  selectedVersionId,
  onChange,
}: {
  versions: EmailConfigurationVersion[];
  selectedVersionId: string;
  onChange: (version: string) => void;
}) => {
  const STATUS_PROPS = {
    released: { color: "success", text: "Veröffentlicht" },
    draft: { color: "secondary", text: "Entwurf" },
    archived: { color: "danger", text: "Archiviert" },
  };

  const handleSelect = (key: any, event: any) => {
    onChange(key);
  };

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  return (
    <Form>
      <Form.Group controlId="exampleForm.SelectCustom">
        <Dropdown onSelect={handleSelect}>
          <Dropdown.Toggle
            style={{ width: "100%" }}
            variant={
              "outline-" +
              (selectedVersion
                ? STATUS_PROPS[selectedVersion!!.status || "draft"].color
                : "primary")
            }
            id="dropdown-custom-components"
          >
            {selectedVersion
              ? `${
                  STATUS_PROPS[selectedVersion.status!!].text
                } ${selectedVersion.updatedAt.toISOString()}`
              : "Select version"}
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ width: "100%", textAlign: "center" }}>
            {versions.map((v: EmailConfigurationVersion) => (
              <Dropdown.Item
                key={v.id}
                eventKey={v.id}
              >
                <Badge bg={STATUS_PROPS[v.status || "draft"].color}>
                  {STATUS_PROPS[v.status || "draft"].text}
                </Badge>{" "}
                {v.updatedAt.toISOString()}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Form.Group>
    </Form>
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

  const handleEdit = () => {
    onClose();
    navigate(Paths.emailConfigurationEdit.replace(":id", selectedVersionId));
  };

  return (
    <Modal
      show={Boolean(open)}
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
            versions={versions}
            selectedVersionId={selectedVersionId}
            onChange={(id: string) => setSelectedVersionId(id)}
          />
          {selectedVersion && (
            <>
              <hr />
              <span>
                <strong>Betreff: </strong> {selectedVersion.subject}
              </span>
              <HtmlInDiv htmlContent={selectedVersion!!.html!!} />
            </>
          )}
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
          variant="primary"
          onClick={handleEdit}
        >
          Editieren
        </Button>
      </Modal.Footer>
    </Modal>
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
  const configApi = useApi(EmailConfigurationApi);
  const versionApi = useApi(EmailConfigurationVersionApi);
  const showAlert = useAlert();

  const [recipients, setRecipients] = useState<string[]>([]);
  const handleRecipientsChange = (emails: string[]) => {
    setRecipients(emails);
  };

  const [versions, setVersions] = useState<EmailConfigurationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const handleSendEmail = () => {
    onClose();
    versionApi
      .emailConfigurationVersionSendTestEmail({
        id: selectedVersionId!!,
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

  return (
    <Modal
      show={Boolean(open)}
      onHide={onClose}
      dialogClassName="preview-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Testmail senden</Modal.Title>
      </Modal.Header>
      {emailConfiguration && (
        <Modal.Body>
          Möchtest du die Email <strong>{emailConfiguration!!.name}</strong> als
          Testmail versenden?
          <br />
          <EmailInput onEmailListChange={handleRecipientsChange} />
          <br />
          <EmailConfigurationVersionSelect
            versions={versions}
            selectedVersionId={selectedVersionId}
            onChange={(id: string) => setSelectedVersionId(id)}
          />
          {selectedVersionId && (
            <>
              <br />
              Vorschau
              <HtmlInDiv
                htmlContent={
                  versions.find((v) => v.id === selectedVersionId)!!.html!!
                }
              />
            </>
          )}
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
