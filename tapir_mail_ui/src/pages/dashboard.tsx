import { PlusCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  EmailDispatch,
  EmailDispatchApi,
  EmailTemplate,
  EmailTemplateApi,
} from "../api_client";
import Loading from "../components/loading";
import { useAlert } from "../contexts/alerts";
import { useApi } from "../hooks/useApi";
import Paths from "../routing";
import { formatDate } from "../utils/formatDate";
import EmailConfigurationDispatchTable from "../components/EmailConfigurationDispatchTable";

function Dashboard() {
  return (
    <>
      <Link to={Paths.mediaLibrary}>
        <Button
          variant="primary"
          style={{ margin: "1em", width: "20em" }}
        >
          Medien verwalten
        </Button>
      </Link>
      <Link to={Paths.dummyAccounts}>
        <Button
          variant="primary"
          style={{ margin: "1em", width: "20em" }}
        >
          Users
        </Button>
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridGap: "2em",
          margin: "2em",
        }}
      >
        <TemplatesCard />
        <EmailConfigurationDispatchTable
          cardTitle="Zuletzt gesendete Emails"
          content="last-sent"
        />
        <EmailConfigurationDispatchTable
          cardTitle="Next sent Emails"
          content="next-sends"
        />
        <DispatchCard />
      </div>
    </>
  );
}

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
        showAlert("Fehler beim Laden der Templates", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <Card.Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h4>Templates</h4>
          <Link to="/editor">
            <PlusCircleIcon
              title="Neues Template"
              style={{
                width: "3em",
                padding: "0.25em",
                borderRadius: "50%",
                color: "green",
              }}
            />
          </Link>
        </div>
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

const DispatchCard = () => {
  const [dispatches, setDispatches] = useState<EmailDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(EmailDispatchApi);

  useEffect(() => {
    api
      .emailDispatchList()
      .then(setDispatches)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Templates", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <Card.Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h4>Dispatches</h4>
        </div>
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
                <th>Recipient</th>
                <th>Sent time</th>
                <th>Config</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((dispatch) => (
                <tr key={dispatch.id}>
                  <td>{dispatch.recipient}</td>
                  <td>{formatDate(dispatch.sentTime)}</td>
                  <td>
                    {
                      dispatch.emailConfigurationDispatch
                        .emailConfigurationVersion.emailConfiguration.name
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default Dashboard;
