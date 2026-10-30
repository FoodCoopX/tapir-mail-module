import { IEmailTemplate } from "easy-email-editor";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { EmailTemplateApi, TemplateTypeEnum } from "../api_client";
import Editor, { EMPTY_PAGE } from "../components/editor";
import Loading from "../components/loading";
import { useAlert } from "../contexts/alerts";
import { useApi } from "../hooks/useApi";
import { jsonToMjml, mjmlToJson } from "../utils/mjml";

const TemplateEditor = () => {
  const showAlert = useAlert();
  const navigate = useNavigate();
  const api = useApi(EmailTemplateApi);

  const { templateId } = useParams();

  const [id, setId] = useState(templateId);
  const [name, setName] = useState("");
  const [templateType, setTemplateType] = useState<TemplateTypeEnum>(
    TemplateTypeEnum.Start,
  );
  const [isDefaultLayout, setIsDefaultLayout] = useState(false);
  const [content, setContent] = useState<any>(EMPTY_PAGE);
  const [showSaveGateModal, setShowSaveGateModal] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id || !api || !showAlert || !navigate) return;

    setLoading(true);
    api
      .emailTemplateRetrieve({ id: id })
      .then((data) => {
        setId(data.id);
        setName(data.name);
        setTemplateType(data.templateType ?? TemplateTypeEnum.Start);
        setIsDefaultLayout(data.isDefaultLayout ?? false);
        setContent(mjmlToJson(data.content));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
        navigate("/");
      });
  }, [id]);

  const handleBack = (values: IEmailTemplate) => {
    if (values.content === content) {
      navigate("/");
    } else {
      setShowSaveGateModal(true);
    }
  };

  const handleSave = (values: IEmailTemplate) => {
    const contentMjml = jsonToMjml(values.content);

    if (
      templateType === TemplateTypeEnum.Layout &&
      !contentMjml.includes("{{Body}}")
    ) {
      showAlert(
        "Eine Layout-Vorlage muss den Platzhalter {{Body}} enthalten.",
        "danger",
      );
      return;
    }

    const props = {
      emailTemplateRequest: {
        name: name,
        content: contentMjml,
        templateType: templateType,
        isDefaultLayout:
          templateType === TemplateTypeEnum.Layout ? isDefaultLayout : false,
      },
    };
    if (templateId) {
      api
        .emailTemplateUpdate({
          id: templateId,
          ...props,
        })
        .then((data) => {
          showAlert("Deine Änderungen wurden gespeichert!", "success");
          setContent(values.content);
        })
        .catch((err) => {
          showAlert(`Beim Speichern ist ein Fehler aufgetreten.`, "danger");
        });
    } else {
      api
        .emailTemplateCreate(props)
        .then((data) => {
          showAlert("Dein Vorlage wurde gespeichert!", "success");
          if (data.id) {
            navigate("/editor/" + data.id);
          }
        })
        .catch((err) => {
          showAlert(`Beim Speichern ist ein Fehler aufgetreten.`, "danger");
        });
    }
  };

  const handleCloseModal = () => setShowSaveGateModal(false);
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "2em",
          alignItems: "center",
          padding: "0.5em 1em",
        }}
      >
        <Form.Group>
          <Form.Label>Vorlagen-Typ</Form.Label>
          <Form.Control
            as="select"
            value={templateType}
            onChange={(event) =>
              setTemplateType(event.target.value as TemplateTypeEnum)
            }
          >
            <option value={TemplateTypeEnum.Start}>Start-Vorlage</option>
            <option value={TemplateTypeEnum.Layout}>Layout-Vorlage</option>
          </Form.Control>
        </Form.Group>
        {templateType === TemplateTypeEnum.Layout && (
          <>
            <Form.Check
              type="checkbox"
              label="Als Standard-Layout verwenden"
              checked={isDefaultLayout}
              onChange={(event) => setIsDefaultLayout(event.target.checked)}
            />
            <span>
              Füge den Platzhalter <code>{"{{Body}}"}</code> dort ein, wo der
              E-Mail-Inhalt erscheinen soll.
            </span>
          </>
        )}
      </div>
      <Modal
        show={showSaveGateModal}
        onHide={handleCloseModal}
        centered={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Achtung!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Du hast <strong>ungespeicherte Änderungen</strong>!<br />
          Möchtest du deine Änderungen wirklich verwerfen?
        </Modal.Body>
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            variant="danger"
            onClick={() => navigate("/")}
          >
            Änderungen verwerfen
          </Button>
          <Button
            variant="success"
            onClick={handleCloseModal}
          >
            Weiter Editieren
          </Button>
        </Modal.Footer>
      </Modal>
      {loading ? (
        <Loading />
      ) : (
        <Editor
          onGoBack={handleBack}
          onSave={handleSave}
          onTemplateNameChange={(name) => setName(name)}
          templateName={name}
          content={content}
        />
      )}
    </>
  );
};

export default TemplateEditor;
