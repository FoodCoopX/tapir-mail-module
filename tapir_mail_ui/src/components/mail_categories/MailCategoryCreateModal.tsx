import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { MailCategoryApi, ModeEnum } from "../../api_client";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import MailCategoryForm from "./MailCategoryForm";

interface MailCategoriesCreateModalProps {
  open: boolean;
  onClose: () => void;
  segmentNames: string[];
}

const MailCategoriesCreateModal: React.FC<MailCategoriesCreateModalProps> = ({
  open,
  onClose,
  segmentNames,
}) => {
  const [loading, setLoading] = useState(false);
  const mailCategoryApi = useApi(MailCategoryApi);
  const showAlert = useAlert();
  const [categoryName, setCategoryName] = useState("");
  const [categoryMode, setCategoryMode] = useState<ModeEnum>(
    ModeEnum.OptionalDefaultOn,
  );
  const [externalsEnabled, setExternalsEnabled] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      nameRef.current?.focus();
    }
  }, [open]);

  function onCreateClicked() {
    setLoading(true);

    mailCategoryApi
      .mailCategoryCreate({
        mailCategoryRequest: {
          name: categoryName,
          mode: categoryMode,
          availableForExternalRecipients: externalsEnabled,
          dynamicSegmentName: segmentName,
        },
      })
      .then(() => {
        onClose();
        setCategoryName("");
      })
      .catch(async (err) => {
        console.error(err);
        showAlert(
          "Fehler beim erzeugen der Kategorie: " +
            JSON.stringify(await err.response.json()),
          "danger",
        );
      })
      .finally(() => setLoading(false));
  }

  return (
    <Modal
      show={open}
      onHide={onClose}
      size={"lg"}
      centered={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Mail Kategorie erzeugen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MailCategoryForm
          open={open}
          categoryName={categoryName}
          setCategoryName={setCategoryName}
          categoryMode={categoryMode}
          setCategoryMode={setCategoryMode}
          segmentName={segmentName}
          setSegmentName={setSegmentName}
          externalsEnabled={externalsEnabled}
          setExternalsEnabled={setExternalsEnabled}
          segmentNames={segmentNames}
        />
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-end align-items-center">
        <TapirButton
          variant={"primary"}
          text={loading ? "Loading..." : "Erzeugen"}
          icon={PlusCircleIcon}
          disabled={loading}
          onClick={() => onCreateClicked()}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default MailCategoriesCreateModal;
