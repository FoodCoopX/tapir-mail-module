import { IPage } from "easy-email-core";
import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EmailConfigurationVersionApi,
  EmailTemplate,
  EmailTemplateApi,
} from "../../api_client";
import Editor, { EMPTY_PAGE } from "../../components/editor";
import EmailInput from "../../components/emailInput";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { jsonToMjml, mjmlToJson } from "../../utils/mjml";
import DateTimePicker from "../../components/dateTimePicker";

const ID_NEW_TEMPLATE = "<new>";

const EmailConfigurationEditor = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState<Boolean>(Boolean(id));
  const [mailingName, setMailingName] = useState("");
  const [subject, setSubject] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>(ID_NEW_TEMPLATE);
  const [recipients, setRecipients] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadedContent, setLoadedContent] = useState<IPage | undefined>(
    EMPTY_PAGE,
  );
  const [content, setContent] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<string>("draft");

  const [lastSavedTime, setLastSavedTime] = useState(Date.now());

  const showAlert = useAlert();

  const templateApi = useApi(EmailTemplateApi);
  const api = useApi(EmailConfigurationVersionApi);

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
      api
        .emailConfigurationVersionGetBundledInfoRetrieve({
          id: id,
        })
        .then((data) => {
          const content = data.content ? mjmlToJson(data.content) : EMPTY_PAGE;

          setSubject(data.subject);
          setSubtitle(data.subtitle || "");
          setLoadedContent(content);
          setStatus(data.releaseStatus || "draft");
          setMailingName(data.name || "");
          setRecipients(data.recipients || "");
          setScheduledTime(data.scheduledTime);
        })
        .catch((err) => {
          console.error(err);
          showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      fetchTemplates();
    }
  }, [id]);

  const saveVersion = (content: IPage, newStatus: string = status) => {
    return new Promise<void>((resolve, reject) => {
      setLastSavedTime(Date.now());
      setStatus(newStatus);

      const props = {
        description: "TODO",
        subject: subject,
        subtitle: subtitle,
        content: jsonToMjml(content),
        name: mailingName,
        recipients: recipients,
        scheduledTime: scheduledTime,
        releaseStatus: newStatus,
      };

      if (id) {
        // UPDATE
        if (status === "released") {
          // create new draft version
          api
            .emailConfigurationVersionCreate({
              bundledEmailConfiguration: {
                ...props,
              },
            })
            .then((data) => {
              console.log(data);
              navigate(Paths.emailConfigurationEdit.replace(":id", data.id));
              resolve();
            })
            .catch(reject);
        } else {
          // update current draft version
          api
            .emailConfigurationVersionUpdate({
              id: id!!,
              bundledEmailConfiguration: props,
            })
            .then(() => {
              setLoadedContent(content);
              resolve();
            })
            .catch(reject);
        }
      } else {
        // CREATE
        api
          .emailConfigurationVersionCreate({
            bundledEmailConfiguration: {
              ...props,
            },
          })
          .then(({ id }) => {
            navigate(Paths.emailConfigurationEdit.replace(":id", id));
            resolve();
          })
          .catch(reject);
      }
    });
  };

  const handleEditorChange = (content: IPage) => {
    setContent(content);
    const currentTime = Date.now();
    if (
      id &&
      currentTime - lastSavedTime >= 1000 &&
      content !== loadedContent
    ) {
      saveVersion(content);
    }
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

  const handleRelease = () =>
    saveVersion(content, "released")
      .then(() => showAlert("Email Konfiguration veröffentlicht!", "success"))
      .catch(() =>
        showAlert("Beim Veröffentlichen ist ein Fehler aufgetreten.", "danger"),
      );

  const handleSaveDraft = () =>
    saveVersion(content, "draft")
      .then(() => {
        showAlert("Email Konfiguration gespeichert!", "success");
      })
      .catch(() =>
        showAlert("Beim Speichern ist ein Fehler aufgetreten.", "danger"),
      );

  const saveButtonDisabled =
    !mailingName || !subject || (id !== undefined && content !== loadedContent);
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

          <Form.Label>Empfänger</Form.Label>
          <EmailInput
            initialValue={recipients.split(",")}
            onEmailListChange={(emails) => setRecipients(emails.join(","))}
            autoFocus={false}
          />
          <br />

          <Form.Group>
            <Form.Label>Versandzeitpunkt</Form.Label>
            <DateTimePicker
              onChange={(datetime) => setScheduledTime(datetime)}
              initialValue={scheduledTime}
            />
          </Form.Group>

          <hr />
          <Button
            disabled={saveButtonDisabled}
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
            onClick={handleSaveDraft}
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
