import React from "react";
import { Badge, Dropdown, Form } from "react-bootstrap";
import { EmailConfigurationVersion } from "../api_client";
import { mjmlToHtml } from "../utils/mjml";
import HtmlInDiv from "./htmlInDiv";
import { formatDate } from "../utils/formatDate";
import { EMAIL_CONFIGURATION_VERSION_STATUS_PROPS } from "../utils/emailConfigurationVersionStatusProps";

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
                  ? EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[
                      selectedVersion!!.status || "draft"
                    ].color
                  : "primary")
              }
              id="dropdown-custom-components"
            >
              {selectedVersion
                ? `${
                    EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[
                      selectedVersion.status!!
                    ].text
                  } ${formatDate(selectedVersion.updatedAt)}`
                : "Select version"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: "100%", textAlign: "center" }}>
              {versions.map((v: EmailConfigurationVersion) => (
                <Dropdown.Item
                  key={v.id}
                  eventKey={v.id}
                >
                  <Badge
                    bg={
                      EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[
                        v.status || "draft"
                      ].color
                    }
                  >
                    {
                      EMAIL_CONFIGURATION_VERSION_STATUS_PROPS[
                        v.status || "draft"
                      ].text
                    }
                  </Badge>{" "}
                  {formatDate(v.updatedAt)}
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
