import React, { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import { useApi } from "../../hooks/useApi";
import { useAlert } from "../../contexts/alerts";
import Loading from "./../loading";
import { MailCategory, MailCategoryApi } from "../../api_client";
import TapirButton from "../TapirButton";
import {
  DocumentDuplicateIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import MailCategoriesCreateModal from "./MailCategoryCreateModal";
import { getModeDisplay } from "../../utils/getModeDisplay";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import MailCategoryEditModal from "./MailCategoryEditModal";

interface MailCategoryListModalProps {
  open: boolean;
  onClose: () => void;
}

const MailCategoryListModal: React.FC<MailCategoryListModalProps> = ({
  open,
  onClose,
}) => {
  const [mailCategories, setMailCategories] = useState<MailCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorySelectedForDeletion, setCategorySelectedForDeletion] =
    useState<MailCategory>();
  const [categorySelectedForEdition, setCategorySelectedForEdition] =
    useState<MailCategory>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const mailCategoryApi = useApi(MailCategoryApi);
  const showAlert = useAlert();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  function loadData() {
    if (!open) return;

    setLoading(true);

    mailCategoryApi
      .mailCategoryList()
      .then(setMailCategories)
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Mail-Kategorien", "danger");
      })
      .finally(() => setLoading(false));
  }

  function onDelete() {
    if (categorySelectedForDeletion === undefined) {
      alert("Keine Kategorie ausgewählt");
      return;
    }

    setLoading(true);
    mailCategoryApi
      .mailCategoryDestroy({
        id: categorySelectedForDeletion.id!,
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Mail-Kategorien", "danger");
      })
      .finally(() => {
        loadData();
      });
  }

  return (
    <>
      <Modal
        show={
          open &&
          !createModalOpen &&
          !categorySelectedForDeletion &&
          !categorySelectedForEdition
        }
        onHide={onClose}
        size={"lg"}
      >
        <Modal.Header closeButton>
          <Modal.Title>Mail-Kategorien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <Loading />
          ) : (
            <Table
              striped
              hover
              style={{ margin: "0" }}
            >
              <thead>
                <tr>
                  <th>Kategorie-Name</th>
                  <th>Modus für Mitglieder</th>
                  <th>Für Externe sichtbar</th>
                  <th>Anzahl an Empfänger*innen</th>
                  <th>URL zu Intergration in externe Seiten</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {mailCategories.length === 0 && (
                  <tr>
                    <td colSpan={6}>Noch keine Kategorien</td>
                  </tr>
                )}
                {mailCategories.map((category: MailCategory) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{getModeDisplay(category.mode, false)}</td>
                    <td>
                      {category.availableForExternalRecipients ? "Ja" : "Nein"}
                    </td>
                    <td>{category.nbRecipients}</td>
                    <td>
                      <a href={category.registrationFormLink}>
                        {category.registrationFormLink}
                      </a>
                    </td>
                    <td>
                      <div className={"d-flex flex-row gap-2"}>
                        <TapirButton
                          variant={"outline-primary"}
                          icon={DocumentDuplicateIcon}
                          size={"sm"}
                          onClick={() =>
                            navigator.clipboard.writeText(
                              category.registrationFormLink,
                            )
                          }
                        />
                        <TapirButton
                          variant={"outline-primary"}
                          icon={PencilIcon}
                          size={"sm"}
                          onClick={() => {
                            setCategorySelectedForEdition(category);
                          }}
                        />
                        <TapirButton
                          variant={"outline-danger"}
                          icon={TrashIcon}
                          size={"sm"}
                          onClick={() => {
                            setCategorySelectedForDeletion(category);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end align-items-center">
          <TapirButton
            variant={"outline-primary"}
            text={"Kategorie hinzufügen"}
            icon={PlusCircleIcon}
            onClick={() => setCreateModalOpen(true)}
          />
        </Modal.Footer>
      </Modal>
      <MailCategoriesCreateModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          loadData();
        }}
      />
      <ConfirmDeleteModal
        message={
          "Kategorie löschen bestätigen: " + categorySelectedForDeletion?.name
        }
        open={categorySelectedForDeletion !== undefined}
        onConfirm={() => {
          onDelete();
          setCategorySelectedForDeletion(undefined);
        }}
        onCancel={() => setCategorySelectedForDeletion(undefined)}
      />
      {categorySelectedForEdition && (
        <MailCategoryEditModal
          open={true}
          onClose={() => {
            setCategorySelectedForEdition(undefined);
            loadData();
          }}
          category={categorySelectedForEdition}
        />
      )}
    </>
  );
};

export default MailCategoryListModal;
