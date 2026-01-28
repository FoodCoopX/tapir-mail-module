import React, { useEffect, useRef } from "react";
import { Form, Row } from "react-bootstrap";
import { ModeEnum } from "../../api_client";
import { getModeDisplay } from "../../utils/getModeDisplay";

interface MailCategoryFormProps {
  open: boolean;
  categoryName: string;
  setCategoryName: (name: string) => void;
  categoryMode: ModeEnum;
  setCategoryMode: (mode: ModeEnum) => void;
  segmentName: string;
  setSegmentName: (name: string) => void;
  externalsEnabled: boolean;
  setExternalsEnabled: (enabled: boolean) => void;
  segmentNames: string[];
}

const MailCategoryForm: React.FC<MailCategoryFormProps> = ({
  open,
  categoryName,
  setCategoryName,
  categoryMode,
  setCategoryMode,
  segmentName,
  setSegmentName,
  externalsEnabled,
  setExternalsEnabled,
  segmentNames,
}) => {
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      nameRef.current?.focus();
    }
  }, [open]);

  return (
    <Form>
      <Row>
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control
            ref={nameRef}
            required={true}
            className={categoryName ? "" : "is-invalid"}
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </Form.Group>
      </Row>
      <Row className={"mt-2"}>
        <Form.Group>
          <Form.Label>Modus</Form.Label>
          <Form.Select
            value={categoryMode}
            onChange={(event) =>
              setCategoryMode(event.target.value as ModeEnum)
            }
          >
            {Object.values(ModeEnum).map((mode) => (
              <option
                key={mode}
                value={mode}
              >
                {getModeDisplay(mode, true)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Row>
      <Row className={"mt-2"}>
        <Form.Group>
          <Form.Label>Segment</Form.Label>
          <Form.Select
            value={segmentName}
            onChange={(event) => setSegmentName(event.target.value)}
          >
            <option value={""}>Kein Segment</option>
            {segmentNames.map((name) => (
              <option
                key={name}
                value={name}
              >
                {name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Row>
      <Row className={"mt-4"}>
        <Form.Group controlId={"externals"}>
          <Form.Check
            checked={externalsEnabled}
            onChange={(event) => setExternalsEnabled(event.target.checked)}
            label={"Können Nicht-Mitglieder sich für diese Kategorie anmelden?"}
          />
        </Form.Group>
      </Row>
    </Form>
  );
};

export default MailCategoryForm;
