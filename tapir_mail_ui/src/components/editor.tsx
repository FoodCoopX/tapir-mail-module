/* eslint-disable react/jsx-wrap-multilines */
import React, { FC, useEffect } from "react";

import {
  EmailEditor,
  EmailEditorProvider,
  IEmailTemplate,
} from "easy-email-editor";
import "easy-email-editor/lib/style.css";

import "@arco-themes/react-easy-email-theme/css/arco.css";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { AdvancedType } from "easy-email-core";
import { ExtensionProps, StandardLayout } from "easy-email-extensions";
import "easy-email-extensions/lib/style.css";
import { Alert, Button, Form } from "react-bootstrap";
import { useWindowSize } from "react-use";
import { useAlert } from "../contexts/alerts";
import env from "../env";
import { getMediaLibraryFileUrl } from "../utils/getMediaLibraryFileUrl";
import { mjmlToJson } from "../utils/mjml";
import { addCsrfToken } from "../utils/requests";
//import './CustomBlocks';

const customFontList = [
  {
    name: "Montserrat",
    css: "/static/fonts/Montserrat.css",
  },
  {
    name: "Bitter",
    css: "/static/fonts/Bitter.css",
  },
].map(({ name, css }) => ({ value: name, label: name, css: css }));

const fontList = [
  { name: "Arial" },
  { name: "Tahoma" },
  { name: "Verdana" },
  { name: "Times New Roman" },
  { name: "Courier New" },
  { name: "Georgia" },
  { name: "Lato" },
].map(({ name }) => ({ value: name, label: name }));

const categories: ExtensionProps["categories"] = [
  {
    label: "Content",
    active: true,
    blocks: [
      {
        type: AdvancedType.TEXT,
      },
      {
        type: AdvancedType.IMAGE,
        payload: { attributes: { padding: "0px 0px 0px 0px" } },
      },
      {
        type: AdvancedType.BUTTON,
      },
      {
        type: AdvancedType.SOCIAL,
      },
      {
        type: AdvancedType.DIVIDER,
      },
      {
        type: AdvancedType.SPACER,
      },
      {
        type: AdvancedType.HERO,
      },
      {
        type: AdvancedType.WRAPPER,
      },
    ],
  },
  {
    label: "Layout",
    active: true,
    displayType: "column",
    blocks: [
      {
        title: "2 columns",
        payload: [
          ["50%", "50%"],
          ["33%", "67%"],
          ["67%", "33%"],
          ["25%", "75%"],
          ["75%", "25%"],
        ],
      },
      {
        title: "3 columns",
        payload: [
          ["33.33%", "33.33%", "33.33%"],
          ["25%", "25%", "50%"],
          ["50%", "25%", "25%"],
        ],
      },
      {
        title: "4 columns",
        payload: [["25%", "25%", "25%", "25%"]],
      },
    ],
  },
];

export const createEmptyMjml = () => {
  const baseUrl = new URL(env.REACT_APP_API_ROOT).origin;

  return (
    "<mjml><mj-head>" +
    customFontList
      .map((f) => `<mj-font name="${f.label}" href="${baseUrl + f.css}" />`)
      .join("") +
    "</mj-head><mj-body></mj-body></mjml>"
  );
};

const createEmptyPage = () => {
  return mjmlToJson(createEmptyMjml());
};

export const EMPTY_PAGE = createEmptyPage();

type EditorProps = {
  onGoBack?: (values: IEmailTemplate) => void;
  onSave?: (values: IEmailTemplate) => void;
  onTemplateNameChange?: (name: string) => void;
  templateName?: string;
  mergeTags?: any;
  content?: any;
  onContentChange?: (values: IEmailTemplate) => void;
};

const Editor: React.FC<EditorProps> = ({
  onGoBack,
  onSave,
  onTemplateNameChange,
  onContentChange,
  templateName = "",
  mergeTags = {},
  content = EMPTY_PAGE,
}) => {
  const showAlert = useAlert();

  const handleUploadImage = async (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
      startUpload();

      function startUpload() {
        const uploadFormData = new FormData();
        uploadFormData.append("filepond", file);
        addCsrfToken(uploadFormData);
        fetch(env.REACT_APP_API_ROOT + "/api/media_library/filepond/process/", {
          method: "POST",
          body: uploadFormData,
        }).then((uploadResponse) => {
          if (!uploadResponse.ok) {
            handleError(uploadResponse);
            return;
          }
          uploadResponse.text().then((uploadId) => {
            confirmUpload(uploadId);
          });
        });
      }

      function confirmUpload(uploadId: string) {
        const confirmFormData = new FormData();
        confirmFormData.append("filepond", uploadId);
        addCsrfToken(confirmFormData);
        fetch(env.REACT_APP_API_ROOT + "/api/media_library/confirm_upload/", {
          method: "post",
          body: confirmFormData,
        }).then((confirmResponse) => {
          if (!confirmResponse.ok) {
            handleError(confirmResponse);
            return;
          }

          confirmResponse.json().then((confirmData) => {
            resolve(getMediaLibraryFileUrl(confirmData.uploads[0]));
          });
        });
      }

      function handleError(response: Response) {
        response.text().then((errorMessage) => {
          console.error(errorMessage);
          showAlert("Fehler beim Upload", "danger");
          reject(errorMessage);
        });
      }
    });
  };

  return (
    <div>
      <EmailEditorProvider
        dashed={false}
        data={{ content: content }}
        height={"calc(100vh)"}
        onUploadImage={handleUploadImage}
        autoComplete={false}
        fontList={fontList} // don't include custom fonts here, they are already in the mjml
        onSubmit={onSave}
        enabledLogic={false} // conditional blocks and stuff, interesting but maybe complex at the beginning
        mergeTags={mergeTags}
        // interactiveStyle={hoverColor:'#000000', selectedCorlor:'#000000'} <--- style the editor with CI colors
        // onAddCollection={(collection) => console.log(collection)}  <--- allows to save blocks to a collection for reuse
        // onRemoveCollection={(collection) => console.log(collection)}  <--- allows to remove blocks from a collection
      >
        {({ values }, { submit }) => (
          <CustomEmailEditor
            onContentChange={onContentChange}
            values={values}
            templateName={templateName}
            onTemplateNameChange={onTemplateNameChange}
            onGoBack={onGoBack}
            onSave={onSave}
            content={content}
          />
        )}
      </EmailEditorProvider>
    </div>
  );
};
export default Editor;

type CustomEmailEditorProps = {
  onContentChange?: (values: IEmailTemplate) => void;
  values: IEmailTemplate;
  content?: any;
  templateName?: string;
  onTemplateNameChange?: (name: string) => void;
  onGoBack?: (values: IEmailTemplate) => void;
  onSave?: (values: IEmailTemplate) => void;
};
const CustomEmailEditor: FC<CustomEmailEditorProps> = ({
  onContentChange,
  values,
  content = EMPTY_PAGE,
  templateName = "",
  onTemplateNameChange,
  onGoBack,
  onSave,
}) => {
  const { width } = useWindowSize();

  const smallScene = width < 1400;

  useEffect(() => {
    if (onContentChange) {
      onContentChange(values);
    }
  }, [values, onContentChange]);

  const saveDisabled = templateName.length === 0 || content === values.content;
  return (
    <StandardLayout
      compact={!smallScene}
      categories={categories}
      // showSourceCode=true is needed to have a back button to see the block selection...
      showSourceCode
      jsonReadOnly
      mjmlReadOnly
    >
      {onTemplateNameChange && (
        <Form.Control
          placeholder="Vorlage-Name"
          aria-label="Vorlage-Name"
          required
          style={{ borderRadius: "0" }}
          className={templateName ? "" : "is-invalid"}
          disabled={!onTemplateNameChange}
          onChange={
            onTemplateNameChange
              ? (e) => onTemplateNameChange(e.target.value)
              : (e) => null
          }
          value={templateName}
        />
      )}
      <EmailEditor />
      {onTemplateNameChange && templateName.length === 0 && (
        <Alert variant="warning">
          <ExclamationTriangleIcon width={24} />
          &nbsp;&nbsp;&nbsp;Bitte gib oben einen Namen für das Template ein!
        </Alert>
      )}
      {(onGoBack || onSave) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "1em",
          }}
        >
          {onGoBack ? (
            <Button
              variant="secondary"
              onClick={() => onGoBack(values)}
            >
              Zurück
            </Button>
          ) : (
            <div />
          )}
          {onSave ? (
            <Button
              disabled={saveDisabled}
              variant={saveDisabled ? "disabled" : "success"}
              onClick={() => onSave(values)}
            >
              Template Speichern
            </Button>
          ) : (
            <div />
          )}
        </div>
      )}
    </StandardLayout>
  );
};
