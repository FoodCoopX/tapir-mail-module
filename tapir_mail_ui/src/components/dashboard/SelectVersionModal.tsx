import {
  EmailConfiguration,
  EmailConfigurationApi,
  EmailConfigurationVersion,
} from "../../api_client";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Paths from "../../routing";
import { Button, Modal } from "react-bootstrap";
import EmailConfigurationVersionSelect from "../emailConfigurationVersionSelect";
import SendTestMailModal from "./SendTestMailModal";

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
    if (!emailConfiguration || !configApi || !emailConfiguration) return;

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

export default SelectVersionModal;
