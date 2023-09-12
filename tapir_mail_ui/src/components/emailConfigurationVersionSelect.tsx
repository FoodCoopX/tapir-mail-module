import React from "react";
import { Badge, Dropdown, Form } from "react-bootstrap";
import { EmailConfigurationVersion } from "../api_client";
import { mjmlToHtml } from "../utils/mjml";
import HtmlInDiv from "./htmlInDiv";

const EmailConfigurationVersionSelect = ({
  versions,
  selectedVersionId,
  preview = false,
  onChange,
}: {
  versions: EmailConfigurationVersion[];
  selectedVersionId: string;
  preview?: boolean;
  onChange: (version: string) => void;
}) => {
  const STATUS_PROPS = {
    released: { color: "success", text: "Veröffentlicht" },
    draft: { color: "secondary", text: "Entwurf" },
    archived: { color: "danger", text: "Archiviert" },
  };

  const handleSelect = (key: any, event: any) => {
    onChange(key);
  };

  const selectedVersion: EmailConfigurationVersion | undefined =
    versions.find((v) => v.id === selectedVersionId) || undefined;
  return (
    <div>
      <Form>
        <Form.Group controlId="exampleForm.SelectCustom">
          <Dropdown onSelect={handleSelect}>
            <Dropdown.Toggle
              style={{ width: "100%" }}
              variant={
                "outline-" +
                (selectedVersion
                  ? STATUS_PROPS[selectedVersion!!.status || "draft"].color
                  : "primary")
              }
              id="dropdown-custom-components"
            >
              {selectedVersion
                ? `${
                    STATUS_PROPS[selectedVersion.status!!].text
                  } ${selectedVersion.updatedAt.toISOString()}`
                : "Select version"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: "100%", textAlign: "center" }}>
              {versions.map((v: EmailConfigurationVersion) => (
                <Dropdown.Item
                  key={v.id}
                  eventKey={v.id}
                >
                  <Badge bg={STATUS_PROPS[v.status || "draft"].color}>
                    {STATUS_PROPS[v.status || "draft"].text}
                  </Badge>{" "}
                  {v.updatedAt.toISOString()}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Form.Group>
      </Form>
      {preview && selectedVersion && (
        <>
          <hr />
          <span>
            <strong>Betreff:</strong>&nbsp;{selectedVersion.subject}
          </span>
          <span>
            <small>{selectedVersion.subtitle}</small>
          </span>
          <HtmlInDiv htmlContent={mjmlToHtml(selectedVersion.content!!)} />
        </>
      )}
    </div>
  );
};

export default EmailConfigurationVersionSelect;
