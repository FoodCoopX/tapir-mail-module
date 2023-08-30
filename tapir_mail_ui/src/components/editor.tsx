/* eslint-disable react/jsx-wrap-multilines */
import React from "react";

import {
  EmailEditor,
  EmailEditorProvider,
  IEmailTemplate,
} from "easy-email-editor";
import "easy-email-editor/lib/style.css";

import "@arco-themes/react-easy-email-theme/css/arco.css";
import { AdvancedType, BasicType, BlockManager } from "easy-email-core";
import "easy-email-editor/lib/style.css";
import { ExtensionProps, StandardLayout } from "easy-email-extensions";
import "easy-email-extensions/lib/style.css";
import { Alert, Button, Form } from "react-bootstrap";
import { useWindowSize } from "react-use";
import { useApi } from "../hooks/useApi";
//import './CustomBlocks';

const fontList = [
  "Arial",
  "Tahoma",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Lato",
  "Montserrat",
].map((item) => ({ value: item, label: item }));

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
export const EMPTY_PAGE = BlockManager.getBlockByType(BasicType.PAGE)!.create(
  {},
);

type EditorProps = {
  onGoBack?: (values: IEmailTemplate) => void;
  onSave?: (values: IEmailTemplate) => void;
  onTemplateNameChange?: (name: string) => void;
  templateName?: string;
  content?: any;
  subject?: string;
  subtitle?: string;
  onContentChange?: (values: IEmailTemplate) => void;
};

const Editor: React.FC<EditorProps> = ({
  onGoBack,
  onSave,
  onTemplateNameChange,
  onContentChange,
  templateName = "",
  subject,
  subtitle,
  content = EMPTY_PAGE,
}) => {
  const { width } = useWindowSize();

  const smallScene = width < 1400;

  const handleUploadImage = async (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
      startUpload();

      function startUpload() {
        const uploadFormData = new FormData();
        uploadFormData.append("filepond", file, file.name);
        fetch(
          (process.env.REACT_APP_API_ROOT as string) +
            "/api/media_library/filepond/process/",
          {
            method: "POST",
            body: uploadFormData,
          },
        ).then((uploadResponse) => {
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
        fetch(
          (process.env.REACT_APP_API_ROOT as string) +
            "/api/media_library/confirm_upload/",
          {
            method: "post",
            body: confirmFormData,
          },
        ).then((confirmResponse) => {
          if (!confirmResponse.ok) {
            handleError(confirmResponse);
            return;
          }

          confirmResponse.json().then((confirmData) => {
            const url =
              (process.env.REACT_APP_API_ROOT as string) +
              "/api/media_library/get_file/" +
              confirmData.uploads[0];
            resolve(url);
          });
        });
      }

      function handleError(response: Response) {
        response.text().then((errorMessage) => {
          alert(errorMessage);
          reject(errorMessage);
        });
      }
    });
  };

  return (
    <>
      <div>
        <EmailEditorProvider
          dashed={false}
          data={{ subject: subject, subtitle: subtitle, content: content }}
          height={"calc(100vh)"}
          onUploadImage={handleUploadImage}
          autoComplete={false}
          fontList={fontList}
          onSubmit={onSave}
          enabledLogic={false} // conditional blocks and stuff, interesting but maybe complex at the beginning
          // interactiveStyle={hoverColor:'#000000', selectedCorlor:'#000000'} <--- style the editor with CI colors
          // onAddCollection={(collection) => console.log(collection)}  <--- allows to save blocks to a collection for reuse
          // onRemoveCollection={(collection) => console.log(collection)}  <--- allows to remove blocks from a collection
          // mergeTags={mergeTags} // <--- allows to add tokens to the editor
        >
          {({ values }, { submit }) => {
            if (onContentChange) {
              onContentChange(values);
            }
            const saveDisabled =
              templateName.length === 0 || content === values.content;
            return (
              <>
                <StandardLayout
                  compact={!smallScene}
                  categories={categories}
                  showSourceCode={false}
                >
                  <Form.Control
                    placeholder="Template Name"
                    aria-label="Template Name"
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
                  <EmailEditor />

                  {templateName.length === 0 && (
                    <Alert variant="warning">
                      <small>
                        <svg
                          style={{ height: "1.5em" }}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                        &nbsp;&nbsp;&nbsp;Bitte gib einen Namen für das Template
                        ein!
                      </small>
                    </Alert>
                  )}

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
                </StandardLayout>
              </>
            );
          }}
        </EmailEditorProvider>
      </div>
    </>
  );
};
export default Editor;
