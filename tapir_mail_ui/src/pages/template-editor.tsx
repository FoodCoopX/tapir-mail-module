import { IEmailTemplate } from "easy-email-editor";
import React, { useLayoutEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Editor, { EMPTY_PAGE } from "../components/editor";
import Loading from "../components/loading";
import { useAlert } from "../contexts/alerts";
import { useApi } from "../hooks/useApi";
import { jsonToMjml, mjmlToHtml, mjmlToJson } from "../utils/mjml";
import { EmailTemplateApi } from "../api_client";

const TemplateEditor = () => {
  const showAlert = useAlert();
  const navigate = useNavigate();
  const api = useApi(EmailTemplateApi);

  const { templateId } = useParams();

  const [id, setId] = useState(templateId);
  const [name, setName] = useState("");
  const [content, setContent] = useState<any | undefined>(EMPTY_PAGE);
  const [showSaveGateModal, setShowSaveGateModal] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useLayoutEffect(() => {
    if (id) {
      setLoading(true);
      api
        .emailtemplatesRetrieve({ id: id })
        .then((data) => {
          setId(data.id);
          setName(data.name);
          setContent(mjmlToJson(data.content));
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
          navigate("/");
        });
    }
  }, []);

  const handleBack = (values: IEmailTemplate) => {
    if (values.content != content) {
      setShowSaveGateModal(true);
    } else {
      navigate("/");
    }
  };

  const handleSave = (values: IEmailTemplate) => {
    const props = {
      emailTemplateCreate: {
        name: name,
        content: jsonToMjml(values.content),
      },
    };
    if (!templateId) {
      api
        .emailtemplatesCreate(props)
        .then((data) => {
          showAlert("Dein Template wurde gespeichert!", "success");
          if (data.id) {
            navigate("/editor/" + data.id);
          }
        })
        .catch((err) => {
          showAlert(`Beim Speichern ist ein Fehler aufgetreten.`, "danger");
        });
    } else {
      api
        .emailtemplatesUpdate({
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
    }
  };

  const handleCloseModal = () => setShowSaveGateModal(false);
  return (
    <>
      <Modal
        show={showSaveGateModal}
        onHide={handleCloseModal}
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
