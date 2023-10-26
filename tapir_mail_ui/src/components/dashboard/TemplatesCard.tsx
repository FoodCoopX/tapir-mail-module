import { PlusCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Card, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { EmailTemplate, EmailTemplateApi } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Loading from "../loading";
import Paths from "../../routing";
import { formatDate } from "../../utils/formatDate";
import TapirButton from "../TapirButton";

const TemplatesCard = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const navigate = useNavigate();
  const api = useApi(EmailTemplateApi);

  useEffect(() => {
    if (!api || !showAlert) return;

    api
      .emailtemplatesList()
      .then(setTemplates)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Vorlagen", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
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
                <th>Created</th>
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
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default TemplatesCard;
