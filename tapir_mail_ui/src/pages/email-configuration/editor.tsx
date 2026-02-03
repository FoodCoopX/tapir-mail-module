import {
  CheckCircleIcon,
  HomeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { IPage } from "easy-email-core";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EmailConfigurationVersionApi,
  EmailTemplate,
  EmailTemplateApi,
  SegmentData,
  StatusEnum,
  TokensApi,
  TriggerDataRequest,
  TriggerTokensApi,
} from "../../api_client";
import TapirButton from "../../components/TapirButton";
import Editor, { EMPTY_PAGE } from "../../components/editor";
import EmailConfigurationVersionStatusBadge from "../../components/emailConfigurationVersionStatusBadge";
import Loading from "../../components/loading";
import MultipleTriggerInput from "../../components/multipleTriggerInput";
import SegmentInput from "../../components/segments/segmentInput";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { formatDate } from "../../utils/formatDate";
import { jsonToMjml, mjmlToJson } from "../../utils/mjml";
import ConfirmModal from "../../components/ConfirmModal";
import { CheckIcon } from "@heroicons/react/16/solid";

const ID_NEW_TEMPLATE = "<new>";
const EMPTY_TRIGGER = [{ triggerId: "", triggerFieldValues: {} }];

const stringToStatus = (status: string): StatusEnum => {
  return StatusEnum[
    (status.charAt(0).toUpperCase() +
      status.slice(1)) as keyof typeof StatusEnum
  ];
};

const EmailConfigurationEditor = () => {
  const params = useParams();
  const [currentId, setCurrentId] = useState<string | undefined>(params.id);
  const [loading, setLoading] = useState<boolean>(Boolean(params.id));
  const [mailingName, setMailingName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>(ID_NEW_TEMPLATE);
  const [triggers, setTriggers] = useState<TriggerDataRequest[]>(EMPTY_TRIGGER);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadedContent, setLoadedContent] = useState<IPage | undefined>(
    EMPTY_PAGE,
  );
  const [segmentData, setSegmentData] = useState<SegmentData | undefined>(
    undefined,
  );
  const [content, setContent] = useState<any>(undefined);
  const [status, setStatus] = useState<StatusEnum>(StatusEnum.Draft);
  const [releaseModalOpen, setReleaseModalOpen] = useState<boolean>(false);
  const [updatedAt, setUpdatedAt] = useState<Date | undefined>(undefined);
  const [tokens, setTokens] = useState<{
    [key: string]: { [key: string]: string };
  }>({});
  const [triggerTokens, setTriggerTokens] = useState<{
    [key: string]: { [key: string]: string };
  }>({});
  const [combinedTokens, setCombinedTokens] = useState<{
    [key: string]: { [key: string]: string };
  }>({});
  const [showTemplateConfirmModal, setShowTemplateConfirmModal] =
    useState(false);

  const showAlert = useAlert();
  const templateApi = useApi(EmailTemplateApi);
  const tokensApi = useApi(TokensApi);
  const triggerTokensApi = useApi(TriggerTokensApi);
  const emailConfigurationVersionApi = useApi(EmailConfigurationVersionApi);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTemplateId !== ID_NEW_TEMPLATE) {
      setShowTemplateConfirmModal(true);
    }
  }, [selectedTemplateId]);

  const fetchTemplates = () =>
    templateApi
      .emailTemplateList()
      .then(setTemplates)
      .catch((err) => {
        console.error(err);
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
      });

  const remapTokens = (tokens: any) => {
    const remappedObject: { [key: string]: { [key: string]: string } } = {};
    Object.entries(tokens).forEach(([key, v]) => {
      remappedObject[key] = {} as { [key: string]: string };
      tokens[key].forEach((value: string) => {
        remappedObject[key][value] = value;
      });
    });
    return remappedObject;
  };

  useEffect(() => {
    fetchTemplates();

    if (currentId) {
      emailConfigurationVersionApi
        .emailConfigurationVersionGetBundledInfoRetrieve({
          id: currentId,
        })
        .then((data) => {
          const content = data.content ? mjmlToJson(data.content) : EMPTY_PAGE;

          setSubject(data.subject || "");
          setSegmentData(data.segmentData || undefined);
          setLoadedContent(content);
          setStatus(stringToStatus(data.releaseStatus) || StatusEnum.Draft);
          setMailingName(data.name || "");
          setUpdatedAt(data.updatedAt || undefined);
          setTriggers(
            data.triggers && data.triggers.length > 0
              ? data.triggers
              : EMPTY_TRIGGER,
          );
        })
        .catch((err) => {
          console.error(err);
          showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
        })
        .finally(() => {
          setLoading(false);
        });

      triggerTokensApi.triggerTokensGetTokensRetrieve().then((tokens: any) => {
        setTriggerTokens(tokens);
      });
    }

    tokensApi
      .tokensGetTokensRetrieve()
      .then((tokens: any) => {
        setTokens(remapTokens(tokens));
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Tokens", "danger");
      });
  }, [currentId]);

  const changeId = (id: string) => {
    setCurrentId(id);
    globalThis.window.history.replaceState(
      null,
      "",
      Paths.emailConfigurationEdit.replace(":id", id),
    );
  };

  const saveVersion = (content: IPage, newStatus: StatusEnum = status) => {
    return new Promise<void>((resolve, reject) => {
      const cleanTriggers = triggers.filter((t) => t.triggerId);

      const props = {
        description: "TODO",
        subject: subject,
        content: jsonToMjml(content),
        name: mailingName,
        releaseStatus: newStatus,
        triggers: cleanTriggers,
        segmentData: segmentData,
      };

      if (currentId) {
        // UPDATE
        if (status === StatusEnum.Released) {
          // create new draft version
          emailConfigurationVersionApi
            .emailConfigurationVersionCreate({
              bundledEmailConfigurationRequest: {
                ...props,
              },
            })
            .then(({ id }) => {
              changeId(id);
              resolve();
            })
            .catch(reject);
        } else {
          // update current draft version
          emailConfigurationVersionApi
            .emailConfigurationVersionUpdate({
              id: currentId,
              bundledEmailConfigurationRequest: props,
            })
            .then((data) => {
              setUpdatedAt(data.updatedAt || new Date());
              setStatus(stringToStatus(data.releaseStatus));
              resolve();
            })
            .catch(reject);
        }
      } else {
        // CREATE
        emailConfigurationVersionApi
          .emailConfigurationVersionCreate({
            bundledEmailConfigurationRequest: {
              ...props,
            },
          })
          .then(({ id }) => {
            changeId(id);
            resolve();
          })
          .catch(reject);
      }
    });
  };

  const handleEditorChange = (content: IPage) => {
    if (selectedTemplateId !== ID_NEW_TEMPLATE) {
      return;
    }

    setContent(content);
  };

  const onConfirmTemplateChange = () => {
    setShowTemplateConfirmModal(false);
    setSelectedTemplateId(ID_NEW_TEMPLATE);

    if (selectedTemplateId === ID_NEW_TEMPLATE) {
      setLoadedContent(EMPTY_PAGE);
      setLoading(false);
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) {
      showAlert(
        "Beim Laden der Vorlagen ist ein Fehler aufgetreten.",
        "danger",
      );
      return;
    }

    const content = mjmlToJson(template.content);
    setLoadedContent(content);
  };

  const handleRelease = () =>
    saveVersion(content, "released")
      .then(() => {
        showAlert("Email Konfiguration veröffentlicht!", "success");
        navigate(Paths.dashboard);
      })
      .catch(async (error) => {
        const message = await error.response.text();
        showAlert(
          "Beim Veröffentlichen ist ein Fehler aufgetreten: " + message,
          "danger",
        );
      });

  const handleSaveDraft = () =>
    saveVersion(content, "draft")
      .then(() => {
        showAlert("Email Konfiguration gespeichert!", "success");
        navigate(Paths.dashboard);
      })
      .catch(async (error) => {
        const message = await error.response.text();
        showAlert(
          "Beim Speichern ist ein Fehler aufgetreten: " + message,
          "danger",
        );
      });

  const handleSegmentChange = (segmentData: SegmentData) => {
    setSegmentData(segmentData);
  };

  useEffect(() => {
    let combinedTokens: any = {};
    triggers.forEach((trigger) => {
      if (
        trigger.triggerId ===
          "tapir_mail.triggers.transactional_trigger.transactional_trigger" &&
        trigger.triggerFieldValues["key"] &&
        triggerTokens.hasOwnProperty(trigger.triggerFieldValues["key"])
      ) {
        const newTokens = remapTokens(
          triggerTokens[trigger.triggerFieldValues["key"]],
        );
        Object.keys(newTokens).forEach((key) => {
          combinedTokens[key] = newTokens[key];
        });
      }
    });
    setCombinedTokens({
      ...tokens,
      ...combinedTokens,
    });
  }, [triggers, triggerTokens, tokens]);

  const missingTrigger =
    !triggers || triggers.filter((t) => t.triggerId).length === 0;
  const saveButtonDisabled = !mailingName;
  const segmentChoosen =
    (segmentData &&
      segmentData.dynamicSegmentNamesAdditive.length +
        segmentData.staticSegmentIdsAdditive.length +
        segmentData.mailCategoryIdsAdditive.length >
        0) ||
    (currentId !== undefined && content !== loadedContent);
  const releaseButtonDisabled =
    saveButtonDisabled || !subject || !segmentChoosen || missingTrigger;
  return loading ? (
    <Loading />
  ) : (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 5fr" }}>
        <div style={{ margin: "1em", height: "100%" }}>
          <Link to={Paths.dashboard}>
            <Button
              size="sm"
              style={{ width: "100%" }}
              variant="outline-primary"
            >
              <HomeIcon width={18} />
              &nbsp;&nbsp;Zurück zum Dashboard
            </Button>
          </Link>
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
              <Form.Label>Template auswählen</Form.Label>
              <Form.Control
                as="select"
                value={selectedTemplateId || ID_NEW_TEMPLATE}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
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

            <div
              style={{
                backgroundColor: "var(--color-neutral-1)",
                padding: "1em",
                marginLeft: "-0.5em",
                marginRight: "-0.5em",
                borderRadius: "6px",
                border:
                  "1px solid " +
                  (segmentChoosen
                    ? "var(--color-neutral-3)"
                    : "var(--bs-form-invalid-border-color)"),
              }}
            >
              <SegmentInput
                initialData={segmentData}
                onChange={handleSegmentChange}
              />
            </div>
            <br />

            <MultipleTriggerInput
              initialTriggers={triggers}
              onChange={setTriggers}
              showError={missingTrigger}
            />

            <hr />
            <TapirButton
              disabled={saveButtonDisabled}
              variant={saveButtonDisabled ? "disabled" : "primary"}
              style={{
                width: "100%",
                marginBottom: "1em",
              }}
              onClick={handleSaveDraft}
              icon={CheckCircleIcon}
              text="Entwurf speichern & schließen"
            />
            <TapirButton
              disabled={releaseButtonDisabled}
              variant={releaseButtonDisabled ? "disabled" : "success"}
              style={{
                width: "100%",
              }}
              icon={PaperAirplaneIcon}
              onClick={() => setReleaseModalOpen(true)}
              text="Veröffentlichen & senden"
            />

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
            mergeTags={combinedTokens}
            onContentChange={(values) => handleEditorChange(values.content)}
          />
        </div>
      </div>
      <Modal
        show={releaseModalOpen}
        onHide={() => setReleaseModalOpen(false)}
        centered={true}
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
      <ConfirmModal
        message={
          "Bist du sicher das du diese Vorlage übernehmen will? Alle aktuelle Inhalte werden gelöscht und durch die Vorlage ersetzt"
        }
        title={templates.find((t) => t.id === selectedTemplateId)?.name ?? ""}
        open={showTemplateConfirmModal}
        confirmButtonText={"Übernehmen"}
        confirmButtonVariant={"outline-primary"}
        confirmButtonIcon={CheckIcon}
        onConfirm={onConfirmTemplateChange}
        onCancel={() => setShowTemplateConfirmModal(false)}
      />
    </>
  );
};

export default EmailConfigurationEditor;
