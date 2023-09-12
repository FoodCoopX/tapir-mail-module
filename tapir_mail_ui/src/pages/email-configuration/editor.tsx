import { IPage } from "easy-email-core";
import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EmailConfigurationApi,
  EmailConfigurationVersionApi,
  EmailTemplate,
  EmailTemplateApi,
} from "../../api_client";
import Editor, { EMPTY_PAGE } from "../../components/editor";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { jsonToMjml, mjmlToJson } from "../../utils/mjml";

const ID_NEW_TEMPLATE = "<new>";

const EmailConfigurationEditor = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState<Boolean>(Boolean(id));
  const [mailingName, setMailingName] = useState("");
  const [subject, setSubject] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>(ID_NEW_TEMPLATE);
  const [recipients, setRecipients] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadedContent, setLoadedContent] = useState<IPage | undefined>(
    EMPTY_PAGE,
  );
  const [content, setContent] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<string>("draft");

  const [emailConfigurationId, setEmailConfigurationId] = useState<
    string | undefined
  >(undefined);

  const [lastSavedTime, setLastSavedTime] = useState(Date.now());

  const showAlert = useAlert();

  const templateApi = useApi(EmailTemplateApi);
  const versionApi = useApi(EmailConfigurationVersionApi);
  const configApi = useApi(EmailConfigurationApi);

  const navigate = useNavigate();

  const fetchTemplates = () =>
    templateApi
      .emailtemplatesList()
      .then((data) => {
        setTemplates(data);
      })
      .catch((err) => {
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
      });

  useEffect(() => {
    if (id) {
      versionApi
        .emailConfigurationVersionRetrieve({
          id: id,
        })
        .then((data) => {
          const content = data.content ? mjmlToJson(data.content) : EMPTY_PAGE;

          setEmailConfigurationId(data.emailConfiguration);
          setSubject(data.subject);
          setSubtitle(data.subtitle || "");
          setLoadedContent(content);
          setLoading(false);
          setStatus(data.status || "draft");

          if (data.emailConfiguration) {
            configApi
              .emailConfigurationRetrieve({
                id: data.emailConfiguration,
              })
              .then((configData) => {
                setMailingName(configData.name);
                setRecipients(configData.recipients || "");
              })
              .catch((err) => {
                console.error(err);
                showAlert(
                  "Beim Laden der Konfiguration ist ein Fehler aufgetreten.",
                  "danger",
                );
              });
          }
        })
        .catch((err) => {
          console.error(err);
          showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
        });
    } else {
      fetchTemplates();
    }
  }, [id]);

  const saveVersion = (content: IPage) => {
    const props = {
      subject: subject,
      content: jsonToMjml(content),
    };

    if (id) {
      // UPDATE
      configApi.emailConfigurationPartialUpdate({
        id: emailConfigurationId!!,
        patchedEmailConfiguration: {
          name: mailingName,
          recipients: recipients,
        },
      });
      if (status === "released") {
        // create new draft version
        versionApi
          .emailConfigurationVersionCreate({
            emailConfigurationVersionCreate: {
              emailConfiguration: emailConfigurationId!!,
              ...props,
            },
          })
          .then((data) => {
            navigate(Paths.emailConfigurationEdit.replace(":id", data.id!!));
          });
      } else {
        // update current draft version
        versionApi
          .emailConfigurationVersionPartialUpdate({
            id: id!!,
            patchedEmailConfigurationVersion: props,
          })
          .then(() => {
            setLoadedContent(content);
          });
      }
    } else {
      // CREATE
      configApi
        .emailConfigurationCreate({
          emailConfigurationCreate: {
            name: mailingName,
            recipients: recipients,
          },
        })
        .then((configData) => {
          versionApi
            .emailConfigurationVersionCreate({
              emailConfigurationVersionCreate: {
                emailConfiguration: configData.id!!,
                ...props,
              },
            })
            .then((versionData) =>
              navigate(
                Paths.emailConfigurationEdit.replace(":id", versionData.id!!),
              ),
            );
        });
    }
  };

  const handleEditorChange = (content: IPage) => {
    setContent(content);

    const currentTime = Date.now();
    if (id && currentTime - lastSavedTime >= 1000 && content != loadedContent) {
      saveVersion(content);
      setLastSavedTime(currentTime);
    }
  };

  const handleRelease = () => {
    if (!id) {
      saveVersion(content);
    }
    versionApi
      .emailConfigurationVersionReleaseCreate({
        id: id!!,
      })
      .then(() => {
        showAlert("Email Konfiguration wurde veröffentlicht.", "success");
        navigate(Paths.emailConfiguration);
      });
  };

  const handleSelectTemplate = (e: any) => {
    const id = e.target.value;
    if (id !== ID_NEW_TEMPLATE) {
      templateApi
        .emailtemplatesRetrieve({ id: id!! })
        .then((data) => {
          setLoadedContent(mjmlToJson(data.content));
          setSelectedTemplate(id);
        })
        .catch((err) => {
          setSelectedTemplate(ID_NEW_TEMPLATE);
          showAlert(
            "Beim Laden des Templates ist ein Fehler aufgetreten.",
            "danger",
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoadedContent(EMPTY_PAGE);
      setSelectedTemplate(ID_NEW_TEMPLATE);
      setLoading(false);
    }
  };

  const handleSavedraft = () => {
    if (id) {
      configApi.emailConfigurationPartialUpdate({
        id: emailConfigurationId!!,
        patchedEmailConfiguration: {
          name: mailingName,
          recipients: recipients,
        },
      });
      versionApi
        .emailConfigurationVersionPartialUpdate({
          id: id!!,
          patchedEmailConfigurationVersion: {
            subject: subject,
            content: jsonToMjml(content),
          },
        })
        .then(() => {
          showAlert(
            "Email Konfiguration wurde als Entwurf gespeichert.",
            "success",
          );
          navigate(Paths.emailConfiguration);
        });
    } else {
      saveVersion(content);
    }
  };

  const saveButtonDisabled =
    !mailingName || !subject || (id !== undefined && content != loadedContent);
  return loading ? (
    <Loading />
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 5fr" }}>
      <div style={{ margin: "1em" }}>
        <Link to={Paths.emailConfiguration}>
          <Button
            size="sm"
            style={{ width: "100%" }}
            variant="secondary"
          >
            &lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Übersicht
          </Button>
        </Link>
        <hr />
        <Form>
          <Form.Group>
            <Form.Label>Name für das Mailing</Form.Label>
            <Form.Control
              required={true}
              className={mailingName ? "" : "is-invalid"}
              type="text"
              value={mailingName}
              onChange={(e) => setMailingName(e.target.value)}
            />
          </Form.Group>
          <br />

          <Form.Group>
            <Form.Label>Betreff</Form.Label>
            <Form.Control
              required={true}
              className={subject ? "" : "is-invalid"}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Form.Group>
          <br />

          <Form.Group>
            <Form.Label>Untertitel (2. Betreffzeile)</Form.Label>
            <Form.Control
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Form.Group>
          <br />

          {!id && (
            <>
              <Form.Group>
                <Form.Label>Template auswählen</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedTemplate || ID_NEW_TEMPLATE}
                  onChange={handleSelectTemplate}
                >
                  <option value={ID_NEW_TEMPLATE}>Keine Vorlage</option>
                  {templates.map((t: EmailTemplate) => (
                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <br />
            </>
          )}

          <Form.Group>
            <Form.Label>Empfänger</Form.Label>
            <Form.Control
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
          </Form.Group>
          <br />

          <Form.Group>
            <Form.Label>Versandzeitpunkt</Form.Label>
            <Form.Control
              as="select"
              value="now"
              readOnly={true}
              disabled={true}
            >
              <option value="now">Sofort</option>
            </Form.Control>
          </Form.Group>

          <hr />
          <Button
            disabled={!id || saveButtonDisabled}
            variant={saveButtonDisabled ? "disabled" : "primary"}
            style={{ width: "100%", marginBottom: "1em" }}
            onClick={handleRelease}
          >
            Email Konfiguration veröffentlichen
          </Button>
          <Button
            disabled={saveButtonDisabled}
            variant={saveButtonDisabled ? "disabled" : "success"}
            style={{ width: "100%" }}
            onClick={handleSavedraft}
          >
            Als Entwurf speichern
          </Button>
        </Form>
      </div>
      <div>
        <Editor
          content={loadedContent}
          subject={subject}
          subtitle={subtitle}
          onContentChange={(values) => handleEditorChange(values.content)}
        />
      </div>
    </div>
  );
};

export default EmailConfigurationEditor;
