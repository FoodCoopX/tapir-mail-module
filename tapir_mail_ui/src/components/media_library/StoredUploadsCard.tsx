import React, { useState } from "react";
import { DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";

import "filepond/dist/filepond.min.css";
import { Badge, Card, Table } from "react-bootstrap";
import { MediaLibraryApi, StoredUpload } from "../../api_client";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import TapirPagination from "../TapirPagination";
import { getMediaLibraryFileUrl } from "../../utils/getMediaLibraryFileUrl";
import { formatDate } from "../../utils/formatDate";
import { useAlert } from "../../contexts/alerts";
import TapirButton from "../TapirButton";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

interface StoredUploadsCardProps {
  storedUploads: StoredUpload[];
  apiClient: MediaLibraryApi;
  updateStoredUploadsList: () => void;
  itemCount: number;
  currentPage: number;
  goToPage: (pageIndex: number) => void;
}

export default function StoredUploadsCard(props: StoredUploadsCardProps) {
  const showAlert = useAlert();
  const [uploadToDelete, setUploadToDelete] = useState<StoredUpload>();

  function onDeleteConfirmed() {
    if (!uploadToDelete) return;
    props.apiClient
      .storeduploadsDestroy({ uploadId: uploadToDelete.uploadId })
      .then(() => {
        props.updateStoredUploadsList();
      })
      .finally(() => {
        setUploadToDelete(undefined);
      });
  }

  function onCopyUrl(uploadId: string) {
    navigator.clipboard.writeText(getMediaLibraryFileUrl(uploadId));
    showAlert("URL kopiert", "primary");
  }

  function getFilePreview(storedUpload: StoredUpload) {
    const fileName = getDisplayName(storedUpload);
    const fileExtension = fileName.includes(".")
      ? fileName.split(".").pop()!.toLowerCase()
      : undefined;
    if (fileExtension && ["png", "jpg", "jpeg"].includes(fileExtension)) {
      return (
        <img
          src={getMediaLibraryFileUrl(storedUpload.uploadId)}
          style={{ maxHeight: "100px", maxWidth: "100px" }}
          alt="Bildvorschau"
        ></img>
      );
    }
    return (
      <Badge bg="secondary">{fileExtension?.toUpperCase() ?? "DATEI"}</Badge>
    );
  }

  return (
    <>
      <Card className="mb-2">
        <Card.Header as="h5">Gespeicherte Dateien</Card.Header>
        <Card.Body>
          <Table
            striped
            hover
            responsive
            className="align-middle mb-0"
          >
            <thead>
              <tr>
                <th>Vorschau</th>
                <th>Dateiname</th>
                <th></th>
                <th>Gespeichert am</th>
                <th>Hochgeladen von</th>
              </tr>
            </thead>
            <tbody>
              {props.storedUploads.map((storedUpload) => (
                <tr key={storedUpload.uploadId}>
                  <td>{getFilePreview(storedUpload)}</td>
                  <td>
                    <a href={getMediaLibraryFileUrl(storedUpload.uploadId)}>
                      {getDisplayName(storedUpload)}
                    </a>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <TapirButton
                        size="sm"
                        variant="outline-primary"
                        style={{ whiteSpace: "nowrap" }}
                        text="URL kopieren"
                        icon={DocumentDuplicateIcon}
                        onClick={() => onCopyUrl(storedUpload.uploadId)}
                      />
                      <TapirButton
                        size="sm"
                        variant="outline-danger"
                        text="Löschen"
                        icon={TrashIcon}
                        onClick={() => setUploadToDelete(storedUpload)}
                      />
                    </div>
                  </td>
                  <td className="text-nowrap">
                    {formatDate(storedUpload.stored)}
                  </td>
                  <td>{storedUpload.uploadedBy}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
        {props.itemCount > DEFAULT_PAGE_SIZE && (
          <Card.Footer className="d-flex justify-content-center align-items-center">
            <TapirPagination
              pageSize={DEFAULT_PAGE_SIZE}
              itemCount={props.itemCount}
              currentPage={props.currentPage}
              goToPage={props.goToPage}
            />
          </Card.Footer>
        )}
      </Card>
      <ConfirmDeleteModal
        message={
          <>
            Möchtest du die Datei{" "}
            <strong>{uploadToDelete && getDisplayName(uploadToDelete)}</strong>{" "}
            wirklich löschen? E-Mails, die diese Datei verwenden, können sie
            danach nicht mehr anzeigen.
          </>
        }
        open={!!uploadToDelete}
        onConfirm={onDeleteConfirmed}
        onCancel={() => setUploadToDelete(undefined)}
      />
    </>
  );
}

function getDisplayName(storedUpload: StoredUpload) {
  return storedUpload.fileName.split("/").pop()!;
}
