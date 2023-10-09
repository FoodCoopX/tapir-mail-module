import { IPage } from "easy-email-core";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EmailConfigurationVersionApi,
  EmailTemplate,
  EmailTemplateApi,
  StatusEnum,
} from "../../api_client";
import Editor, { EMPTY_PAGE } from "../../components/editor";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { jsonToMjml, mjmlToJson } from "../../utils/mjml";
import { formatDate } from "../../utils/formatDate";
import EmailConfigurationVersionStatusBadge from "../../components/emailConfigurationVersionStatusBadge";
import { HomeIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import TriggerDropdown from "../../components/triggerDropdown";

const ID_NEW_TEMPLATE = "<new>";

const stringToStatus = (status: string): StatusEnum => {
  return StatusEnum[
    (status.charAt(0).toUpperCase() +
      status.slice(1)) as keyof typeof StatusEnum
  ];
};

const EmailConfigurationEditor = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState<Boolean>(Boolean(id));
  const [mailingName, setMailingName] = useState("");
  const [subject, setSubject] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>(ID_NEW_TEMPLATE);
  const [triggerId, setTriggerId] = useState<string | null>("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadedContent, setLoadedContent] = useState<IPage | undefined>(
    EMPTY_PAGE,
  );
  const [content, setContent] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<StatusEnum>(StatusEnum.Draft);
  const [releaseModalOpen, setReleaseModalOpen] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState(Date.now());
  const [updatedAt, setUpdatedAt] = useState<Date | undefined>(undefined);
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
      .catch(() => {
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
          setStatus(stringToStatus(data.releaseStatus) || StatusEnum.Draft);
          setMailingName(data.name || "");
          setUpdatedAt(data.updatedAt || undefined);
          setTriggerId(data.trigger || null);
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

  const saveVersion = (content: IPage, newStatus: StatusEnum = status) => {
    return new Promise<void>((resolve, reject) => {
      setLastSavedTime(Date.now());
      const props = {
        description: "TODO",
        subject: subject,
        subtitle: subtitle,
        content: jsonToMjml(content),
        name: mailingName,
        releaseStatus: newStatus,
        trigger: triggerId,
      };

      if (id) {
        // UPDATE
        if (status === StatusEnum.Released) {
          // create new draft version
          api
            .emailConfigurationVersionCreate({
              bundledEmailConfiguration: {
                ...props,
              },
            })
            .then((data) => {
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
            .then((data) => {
              setUpdatedAt(data.updatedAt || new Date());
              setStatus(stringToStatus(data.releaseStatus));
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
      saveVersion(content, StatusEnum.Draft);
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
        .catch(() => {
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
      .then(() => {
        showAlert("Email Konfiguration veröffentlicht!", "success");
        navigate(Paths.emailConfiguration);
      })
      .catch(() =>
        showAlert("Beim Veröffentlichen ist ein Fehler aufgetreten.", "danger"),
      );

  const handleSaveDraft = () =>
    saveVersion(content, "draft")
      .then(() => {
        showAlert("Email Konfiguration gespeichert!", "success");
        navigate(Paths.emailConfiguration);
      })
      .catch(() =>
        showAlert("Beim Speichern ist ein Fehler aufgetreten.", "danger"),
      );

  const saveButtonDisabled =
    !mailingName || !subject || (id !== undefined && content !== loadedContent);
  return loading ? (
    <Loading />
  ) : (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 5fr" }}>
        <div style={{ margin: "1em", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridGap: "1em",
            }}
          >
            <Link to={Paths.dashboard}>
              <Button
                size="sm"
                style={{ width: "100%" }}
                variant="outline-primary"
              >
                <HomeIcon width={18} />
                &nbsp;&nbsp;Dashboard
              </Button>
            </Link>
            <Link to={Paths.emailConfiguration}>
              <Button
                size="sm"
                style={{ width: "100%" }}
                variant="outline-primary"
              >
                <ListBulletIcon width="18" />
                &nbsp;&nbsp;&nbsp;Übersicht
              </Button>
            </Link>
          </div>
          <hr />
          <Form style={{ maxHeight: "100vh" }}>
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
              <Form.Label>Trigger</Form.Label>
              <TriggerDropdown
                selectedTriggerId={triggerId}
                onChange={setTriggerId}
              />
            </Form.Group>

            <hr />
            <Button
              disabled={saveButtonDisabled}
              variant={saveButtonDisabled ? "disabled" : "primary"}
              style={{ width: "100%", marginBottom: "1em" }}
              onClick={() => setReleaseModalOpen(true)}
            >
              Veröffentlichen & senden
            </Button>
            <Button
              disabled={saveButtonDisabled}
              variant={saveButtonDisabled ? "disabled" : "success"}
              style={{ width: "100%" }}
              onClick={handleSaveDraft}
            >
              Als Entwurf speichern & schließen
            </Button>

            <hr />
            <div>
              <small>
                Zuletzt gespeichert: {formatDate(updatedAt)}
                <br />
                <EmailConfigurationVersionStatusBadge status={status} />
              </small>
            </div>
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
      <Modal
        show={releaseModalOpen}
        onHide={() => setReleaseModalOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Veröffentlichen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchtest du die Email&nbsp;<strong>{mailingName}</strong>
          &nbsp;veröffentlichen? Sie wird zum festgelegten Zeitpunkt an die
          Empfänger versendet.
        </Modal.Body>
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            variant="secondary"
            onClick={() => setReleaseModalOpen(false)}
          >
            Abbrechen
          </Button>
          <Button
            variant="success"
            onClick={() => {
              setReleaseModalOpen(false);
              handleRelease();
            }}
          >
            Veröffentlichen & senden
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EmailConfigurationEditor;
