import { PlusCircleIcon, QueueListIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  EmailConfigurationDispatch,
  EmailConfigurationDispatchApi,
  EmailTemplate,
  EmailTemplateApi,
} from "../api_client";
import Loading from "../components/loading";
import { useAlert } from "../contexts/alerts";
import { useApi } from "../hooks/useApi";
import Paths from "../routing";

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridGap: "2em",
          margin: "2em",
        }}
      >
        <TemplatesCard />
        <LastSendEmailConfigurationsCard />
        <NextSendsEmailConfigurationsCard />
      </div>
    </>
  );
}

const LastSendEmailConfigurationsCard = () => {
  const api = useApi(EmailConfigurationDispatchApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [emailConfigurationDispatches, setEmailConfigurationDispatches] =
    useState<EmailConfigurationDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .emailConfigurationDispatchLastSentList({ limit: 10 })
      .then(setEmailConfigurationDispatches)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der zuletzt gesendeten Emails", "danger");
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
          <h4>Zuletzt gesendete Emails</h4>
          <div>
            <Link to={Paths.emailConfigurationCreate}>
              <PlusCircleIcon
                title="Neue Email Konfiguration"
                style={{
                  width: "3em",
                  padding: "0.25em",
                  borderRadius: "50%",
                  color: "green",
                }}
              />
            </Link>
            <Link to={Paths.emailConfiguration}>
              <QueueListIcon
                title="Alle Email Konfigurationen"
                style={{
                  width: "3em",
                  padding: "0.25em",
                  borderRadius: "50%",
                  color: "primary",
                }}
              />
            </Link>
          </div>
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
                <th>Email Konfiguration</th>
                <th>Betreff</th>
                <th>Gesendet am</th>
                <th>Empfänger</th>
              </tr>
            </thead>
            <tbody>
              {emailConfigurationDispatches.map(
                (emailConfigurationDispatch) => (
                  <tr
                    style={{ cursor: "pointer" }}
                    key={emailConfigurationDispatch.id}
                    onClick={() =>
                      navigate(
                        Paths.emailConfigurationEdit.replace(
                          ":id",
                          emailConfigurationDispatch.emailConfigurationVersion
                            .id!!,
                        ),
                      )
                    }
                  >
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .emailConfiguration.name
                      }
                    </td>
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .subject
                      }
                    </td>
                    <td>
                      {emailConfigurationDispatch.scheduledTime.toISOString()}
                    </td>
                    <td>
                      {emailConfigurationDispatch.recipients.map(
                        (recipient) => (
                          <span>{recipient}</span>
                        ),
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

const NextSendsEmailConfigurationsCard = () => {
  const api = useApi(EmailConfigurationDispatchApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [emailConfigurationDispatches, setEmailConfigurationDispatches] =
    useState<EmailConfigurationDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .emailConfigurationDispatchNextSendsList({ limit: 10 })
      .then(setEmailConfigurationDispatches)
      .catch((err) => {
        console.error(err);
        showAlert(
          "Error loading the next sent emails", //TODO translation
          "danger",
        );
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
          <h4>Next sent Emails</h4> {/*TODO Translation*/}
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
                <th>Email Konfiguration</th>
                <th>Betreff</th>
                <th>Gesendet am</th>
                <th>Empfänger</th>
              </tr>
            </thead>
            <tbody>
              {emailConfigurationDispatches.map(
                (emailConfigurationDispatch) => (
                  <tr
                    style={{ cursor: "pointer" }}
                    key={emailConfigurationDispatch.id}
                    onClick={() =>
                      navigate(
                        Paths.emailConfigurationEdit.replace(
                          ":id",
                          emailConfigurationDispatch.emailConfigurationVersion
                            .id!!,
                        ),
                      )
                    }
                  >
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .emailConfiguration.name
                      }
                    </td>
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .subject
                      }
                    </td>
                    <td>
                      {emailConfigurationDispatch.scheduledTime.toISOString()}
                    </td>
                    <td>
                      {emailConfigurationDispatch.recipients.map(
                        (recipient) => (
                          <span>{recipient}</span>
                        ),
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

const TemplatesCard = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const navigate = useNavigate();
  const api = useApi(EmailTemplateApi);

  useEffect(() => {
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
                  <td>{template.createdAt.toISOString()}</td>
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
