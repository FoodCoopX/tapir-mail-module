import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Card, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  EmailTemplate,
  EmailTemplateApi,
  EmailTemplatePaginatedApi,
} from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Loading from "../loading";
import Paths from "../../routing";
import { formatDate } from "../../utils/formatDate";
import TapirButton from "../TapirButton";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import TapirPagination from "../TapirPagination";

const TemplatesCard = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [templateToDelete, setTemplateToDelete] = useState<
    EmailTemplate | undefined
  >();
  const [currentPage, setCurrentPage] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);

  const showAlert = useAlert();
  const navigate = useNavigate();
  const api = useApi(EmailTemplatePaginatedApi);

  useEffect(() => {
    if (!api || !showAlert) return;

    api
      .emailTemplatePaginatedList({
        limit: DEFAULT_PAGE_SIZE,
        offset: currentPage * DEFAULT_PAGE_SIZE,
      })
      .then((paginatedData) => {
        setTemplates(paginatedData.results ?? []);
        setTemplateCount(paginatedData.count ?? 0);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Vorlagen", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage]);

  function onDeleteTemplateConfirmed() {
    if (!templateToDelete) return;

    api
      .emailTemplatePaginatedDestroy({ id: templateToDelete.id! })
      .then(() => {
        showAlert("Template gelöscht : " + templateToDelete.name, "success");
        setTemplates(
          templates.filter((template) => template.id !== templateToDelete.id),
        );
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim löschen des Templates", "danger");
      })
      .finally(() => {
        setTemplateToDelete(undefined);
      });
  }

  function onDeleteTemplateCancelled() {
    setTemplateToDelete(undefined);
  }

  return (
    <>
      <Card>
        <Card.Header
          as="h5"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Vorlagen</span>
          <Link to={Paths.templateEditorCreate}>
            <TapirButton
              variant="primary"
              text="Neue Vorlage erstellen"
              icon={PlusCircleIcon}
            />
          </Link>
        </Card.Header>
        <Card.Body style={{ padding: 0, border: "none" }}>
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
                  <th>Name</th>
                  <th>Erzeugt am</th>
                  <th>Aktualisiert am</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(
                        Paths.templateEditorEdit.replace(
                          ":templateId",
                          template.id!!,
                        ),
                      )
                    }
                  >
                    <td>{template.name}</td>
                    <td>{formatDate(template.createdAt)}</td>
                    <td>{formatDate(template.updatedAt)}</td>
                    <td
                      style={{
                        alignContent: "right",
                      }}
                    >
                      <TapirButton
                        variant={"outline-danger"}
                        size={"sm"}
                        icon={TrashIcon}
                        onClick={(event) => {
                          event.stopPropagation();
                          setTemplateToDelete(template);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {templateCount > DEFAULT_PAGE_SIZE && (
          <Card.Footer className="d-flex justify-content-center align-items-center">
            <TapirPagination
              pageSize={DEFAULT_PAGE_SIZE}
              itemCount={templateCount}
              currentPage={currentPage}
              goToPage={setCurrentPage}
            />
          </Card.Footer>
        )}
      </Card>
      <ConfirmDeleteModal
        message={
          <>
            Möchtest du das Template <strong>{templateToDelete?.name}</strong>{" "}
            wirklich löschen?
          </>
        }
        open={!!templateToDelete}
        onConfirm={onDeleteTemplateConfirmed}
        onCancel={onDeleteTemplateCancelled}
      />
    </>
  );
};

export default TemplatesCard;
