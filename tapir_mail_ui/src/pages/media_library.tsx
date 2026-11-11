import * as FilePondJs from "filepond";
import { registerPlugin } from "filepond";
import React, { useEffect, useState } from "react";
import { FilePond } from "react-filepond";

import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "filepond/dist/filepond.min.css";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { MediaLibraryApi, StoredUpload, TemporaryUpload } from "../api_client";
import StoredUploadsCard from "../components/media_library/StoredUploadsCard";
import TemporaryUploadsCard from "../components/media_library/TemporaryUploadsCard";
import env from "../env";
import { useApi } from "../hooks/useApi";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { addCsrfToken } from "../utils/requests";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

export default function MediaLibrary() {
  const [temporaryUploads, setTemporaryUploads] = useState<TemporaryUpload[]>(
    [],
  );
  const [temporaryUploadsPage, setTemporaryUploadsPage] = useState(0);
  const [temporaryUploadsCount, setTemporaryUploadsCount] = useState(0);
  const [storedUploads, setStoredUploads] = useState<StoredUpload[]>([]);
  const [storedUploadsPage, setStoredUploadsPage] = useState(0);
  const [storedUploadsCount, setStoredUploadsCount] = useState(0);

  const apiClient = useApi(MediaLibraryApi);

  let pond: FilePond | null = null;

  function onFilePondInit() {
    FilePondJs.setOptions({
      server: {
        url: (env.REACT_APP_API_ROOT as string) + "/api/media_library/filepond",
        process: {
          url: "/process/",
          method: "POST",
          ondata: addCsrfToken,
        },
        revert: "/revert/",
        restore: "/restore/",
        load: "/load/?target=",
        fetch: "/fetch/?target=",
      },
      labelIdle:
        'Dateien hierher ziehen oder <span class="filepond--label-action">durchsuchen</span>',
      labelInvalidField: "Das Feld enthält ungültige Dateien",
      labelFileWaitingForSize: "Dateigröße wird ermittelt",
      labelFileSizeNotAvailable: "Dateigröße nicht verfügbar",
      labelFileLoading: "Wird geladen",
      labelFileLoadError: "Fehler beim Laden",
      labelFileProcessing: "Wird hochgeladen",
      labelFileProcessingComplete: "Hochgeladen",
      labelFileProcessingAborted: "Hochladen abgebrochen",
      labelFileProcessingError: "Fehler beim Hochladen",
      labelFileProcessingRevertError: "Fehler beim Zurücksetzen",
      labelFileRemoveError: "Fehler beim Entfernen",
      labelTapToCancel: "Klicken zum Abbrechen",
      labelTapToRetry: "Klicken zum Wiederholen",
      labelTapToUndo: "Klicken zum Rückgängigmachen",
      labelButtonRemoveItem: "Entfernen",
      labelButtonAbortItemLoad: "Abbrechen",
      labelButtonRetryItemLoad: "Wiederholen",
      labelButtonAbortItemProcessing: "Abbrechen",
      labelButtonUndoItemProcessing: "Rückgängig",
      labelButtonRetryItemProcessing: "Wiederholen",
      labelButtonProcessItem: "Hochladen",
    });
  }

  function updateTemporaryUploadsList() {
    apiClient
      .temporaryuploadsList({
        limit: DEFAULT_PAGE_SIZE,
        offset: temporaryUploadsPage * DEFAULT_PAGE_SIZE,
      })
      .then((result) => {
        if (result.results.length === 0 && temporaryUploadsPage > 0) {
          setTemporaryUploadsPage(temporaryUploadsPage - 1);
          return;
        }
        setTemporaryUploads(result.results);
        setTemporaryUploadsCount(result.count);
      });
  }

  function updateStoredUploadsList() {
    apiClient
      .storeduploadsList({
        limit: DEFAULT_PAGE_SIZE,
        offset: storedUploadsPage * DEFAULT_PAGE_SIZE,
      })
      .then((result) => {
        if (result.results.length === 0 && storedUploadsPage > 0) {
          setStoredUploadsPage(storedUploadsPage - 1);
          return;
        }
        setStoredUploads(result.results);
        setStoredUploadsCount(result.count);
      });
  }

  useEffect(updateTemporaryUploadsList, [temporaryUploadsPage]);

  useEffect(updateStoredUploadsList, [storedUploadsPage]);

  function onConfirmUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    addCsrfToken(formData);
    fetch(
      (env.REACT_APP_API_ROOT as string) + "/api/media_library/confirm_upload/",
      {
        method: "post",
        body: formData,
      },
    ).then((response) => {
      if (response.ok) {
        pond?.removeFiles();
      } else {
        alert("Speichern der Dateien fehlgeschlagen, siehe Konsole");
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
        <h1>Medienbibliothek</h1>
        <Row>
          <Col md={4}>
            <Card className="mb-2">
              <Card.Header as="h5">Dateien hochladen</Card.Header>
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
                  <Button type="submit">Dateien speichern</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col
            md={8}
            style={{ minWidth: 0 }}
          >
            <TemporaryUploadsCard
              temporaryUploads={temporaryUploads}
              itemCount={temporaryUploadsCount}
              currentPage={temporaryUploadsPage}
              goToPage={setTemporaryUploadsPage}
              apiClient={apiClient}
              updateTemporaryUploadsList={updateTemporaryUploadsList}
            />
          </Col>
        </Row>
        <StoredUploadsCard
          storedUploads={storedUploads}
          itemCount={storedUploadsCount}
          currentPage={storedUploadsPage}
          goToPage={setStoredUploadsPage}
          apiClient={apiClient}
          updateStoredUploadsList={updateStoredUploadsList}
        />
      </div>
    </>
  );
}
