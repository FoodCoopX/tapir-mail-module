import * as FilePondJs from "filepond";
import React, { useEffect, useState } from "react";
import { FilePond } from "react-filepond";

import "filepond/dist/filepond.min.css";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { MediaLibraryApi, StoredUpload, TemporaryUpload } from "../api_client";
import StoredUploadsCard from "../components/media_library/StoredUploadsCard";
import TemporaryUploadsCard from "../components/media_library/TemporaryUploadsCard";
import { useApi } from "../hooks/useApi";
import { Link } from "react-router-dom";

export default function MediaLibrary() {
  const [temporaryUploads, setTemporaryUploads] = useState<TemporaryUpload[]>(
    [],
  );
  const [storedUploads, setStoredUploads] = useState<StoredUpload[]>([]);

  const apiClient = useApi(MediaLibraryApi);

  let pond: FilePond | null = null;

  function onFilePondInit() {
    FilePondJs.setOptions({
      server: {
        url:
          (process.env.REACT_APP_API_ROOT as string) +
          "/api/media_library/filepond",
        process: "/process/",
        revert: "/revert/",
        restore: "/restore/",
        load: "/load/?target=",
        fetch: "/fetch/?target=",
      },
    });
  }

  function updateTemporaryUploadsList() {
    apiClient.temporaryuploadsList().then((result) => {
      setTemporaryUploads(result);
    });
  }

  function updateStoredUploadsList() {
    apiClient.storeduploadsList().then((result) => {
      setStoredUploads(result);
    });
  }

  useEffect(() => {
    updateTemporaryUploadsList();
    updateStoredUploadsList();
  }, []);

  function onConfirmUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    fetch(
      (process.env.REACT_APP_API_ROOT as string) +
        "/api/media_library/confirm_upload/",
      {
        method: "post",
        body: formData,
      },
    ).then((response) => {
      if (response.ok) {
        pond?.removeFiles();
      } else {
        alert("Upload confirmation failed, see console");
        console.error(response.text());
      }
      updateTemporaryUploadsList();
      updateStoredUploadsList();
    });
  }

  return (
    <>
      <div
        className="container"
        style={{ margin: "auto", marginTop: "2em" }}
      >
        <Link to="/">
          <Button
            size="sm"
            variant="secondary"
          >
            &lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Übersicht
          </Button>
        </Link>
        <h1>Prototype media library</h1>
        <Row>
          <Col>
            <Card className="mb-2">
              <Card.Header as="h5">Uploader</Card.Header>
              <Card.Body>
                <Form onSubmit={onConfirmUpload}>
                  <FilePond
                    ref={(ref) => {
                      pond = ref;
                    }}
                    allowMultiple={true}
                    oninit={() => onFilePondInit()}
                    onprocessfiles={updateTemporaryUploadsList}
                  />
                  <Button type="submit">Confirm upload</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <StoredUploadsCard
              storedUploads={storedUploads}
              apiClient={apiClient}
              updateStoredUploadsList={updateStoredUploadsList}
            />
          </Col>
          <Col>
            <TemporaryUploadsCard
              temporaryUploads={temporaryUploads}
              apiClient={apiClient}
              updateTemporaryUploadsList={updateTemporaryUploadsList}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}
