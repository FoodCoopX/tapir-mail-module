import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import { MailCategory, MailCategoryApi, ModeEnum } from "../../api_client";
import TapirButton from "../TapirButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import MailCategoryForm from "./MailCategoryForm";

interface MailCategoryEditModalProps {
  open: boolean;
  onClose: () => void;
  category: MailCategory;
  segmentNames: string[];
}

const MailCategoryEditModal: React.FC<MailCategoryEditModalProps> = ({
  open,
  onClose,
  category,
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

  useEffect(() => {
    setCategoryName(category.name);
    setCategoryMode(category.mode);
    setExternalsEnabled(category.availableForExternalRecipients);
  }, [category]);

  function onSaveClicked() {
    setLoading(true);

    mailCategoryApi
      .mailCategoryUpdate({
        id: category.id!,
        mailCategoryRequest: {
          name: categoryName,
          mode: categoryMode,
          availableForExternalRecipients: externalsEnabled,
          dynamicSegmentName: segmentName,
        },
      })
      .then(() => {
        onClose();
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Speichern der Kategorie", "danger");
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
          text={loading ? "Loading..." : "Speichern"}
          icon={PlusCircleIcon}
          disabled={loading}
          onClick={() => onSaveClicked()}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default MailCategoryEditModal;
