import {
  EmailConfiguration,
  EmailConfigurationApi,
  EmailConfigurationVersion,
  EmailConfigurationVersionApi,
} from "../../api_client";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Paths from "../../routing";
import { Modal } from "react-bootstrap";
import EmailConfigurationVersionSelect from "../emailConfigurationVersionSelect";
import SendTestMailModal from "./SendTestMailModal";
import TapirButton from "../TapirButton";
import {
  ArchiveBoxArrowDownIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import HtmlInDiv from "../htmlInDiv";
import { mjmlToHtml } from "../../utils/mjml";
import TapirTooltip from "../TapirTooltip";
import { getDisplayName } from "../../utils/emailConfigurationVersionDisplayName";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import ConfirmModal from "../ConfirmModal";

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
  const versionApi = useApi(EmailConfigurationVersionApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [versions, setVersions] = useState<EmailConfigurationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [confirmArchiveVersionModalOpen, setConfirmArchiveVersionModalOpen] =
    useState(false);
  const [confirmDeleteVersionModalOpen, setConfirmDeleteVersionModalOpen] =
    useState(false);

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
  const handleArchive = () => {
    if (!selectedVersionId || !selectedVersion) return;

    versionApi
      .emailConfigurationVersionArchiveCreate({ id: selectedVersionId })
      .then(() => {
        showAlert(
          "Version archiviert : " + getDisplayName(selectedVersion),
          "success",
        );
      })
      .catch((error) => {
        console.error(error);
        showAlert(
          "Fehler beim archivieren von " + getDisplayName(selectedVersion),
          "danger",
        );
      })
      .finally(() => {
        setConfirmArchiveVersionModalOpen(false);
      });
  };
  const handleDelete = () => {
    if (!selectedVersionId || !selectedVersion) return;

    versionApi
      .emailConfigurationVersionDestroy({ id: selectedVersionId })
      .then(() => {
        showAlert(
          "Version gelöscht : " + getDisplayName(selectedVersion),
          "success",
        );
      })
      .catch((error) => {
        console.error(error);
        showAlert(
          "Fehler beim löschen von " + getDisplayName(selectedVersion),
          "danger",
        );
      })
      .finally(() => {
        setConfirmDeleteVersionModalOpen(false);
      });
  };

  return (
    <>
      <Modal
        show={
          Boolean(open) &&
          !sendModalOpen &&
          !confirmArchiveVersionModalOpen &&
          !confirmDeleteVersionModalOpen
        }
        onHide={onClose}
        dialogClassName="preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Email Konfiguration: {emailConfiguration?.name}
          </Modal.Title>
        </Modal.Header>
        {emailConfiguration && (
          <Modal.Body>
            Welche Version möchtest du editieren?
            <div className="d-flex justify-content-between">
              <EmailConfigurationVersionSelect
                versions={versions}
                selectedVersionId={selectedVersionId}
                onChange={(id: string) => setSelectedVersionId(id)}
              />
              <span className="d-flex gap-2">
                <TapirTooltip
                  id={"archive-button"}
                  text={
                    "Nur veröffentlichte Versionen können archiviert werden."
                  }
                  enabled={selectedVersion?.status !== "released"}
                >
                  <TapirButton
                    variant="danger"
                    text="Archivieren"
                    icon={ArchiveBoxArrowDownIcon}
                    disabled={selectedVersion?.status !== "released"}
                    onClick={() => setConfirmArchiveVersionModalOpen(true)}
                  />
                </TapirTooltip>
                <TapirTooltip
                  id={"delete-button"}
                  text={
                    "Dieses Version kann nicht gelöscht werden weil sie ist schon verschickt worden."
                  }
                  enabled={!selectedVersion?.canBeDeleted}
                >
                  <TapirButton
                    variant="danger"
                    text="Delete"
                    icon={TrashIcon}
                    disabled={!selectedVersion?.canBeDeleted}
                    onClick={() => setConfirmDeleteVersionModalOpen(true)}
                  />
                </TapirTooltip>
              </span>
            </div>
            <hr />
            <span>
              <strong>Betreff:</strong>&nbsp;{selectedVersion?.subject}
            </span>
            {selectedVersion?.content && (
              <HtmlInDiv htmlContent={mjmlToHtml(selectedVersion?.content)} />
            )}
          </Modal.Body>
        )}
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <TapirButton
            variant="secondary"
            text="Abbrechen"
            icon={XMarkIcon}
            onClick={onClose}
          />
          <div className="d-flex gap-2">
            <TapirButton
              variant="primary"
              text="Testmail senden"
              icon={PaperAirplaneIcon}
              onClick={() => setSendModalOpen(true)}
            />
            <TapirButton
              variant="primary"
              text="Editieren"
              icon={PencilIcon}
              onClick={handleEdit}
            />
          </div>
        </Modal.Footer>
      </Modal>
      <SendTestMailModal
        open={sendModalOpen}
        emailConfigurationVersion={selectedVersion!}
        onClose={handleCloseSendModal}
      />
      <ConfirmModal
        message={
          "Möchten Sie wirklich die version '" +
          getDisplayName(selectedVersion) +
          "' archivieren?"
        }
        open={confirmArchiveVersionModalOpen}
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchiveVersionModalOpen(false)}
        confirmButtonIcon={ArchiveBoxArrowDownIcon}
        confirmButtonText={"Archivieren"}
        title={"Archivieren bestätigen"}
        confirmButtonVariant="danger"
      />
      <ConfirmDeleteModal
        message={
          "Möchten Sie wirklich die version '" +
          getDisplayName(selectedVersion) +
          "' löschen?"
        }
        open={confirmDeleteVersionModalOpen}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVersionModalOpen(false)}
      />
    </>
  );
};

export default SelectVersionModal;
