import React from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

import "filepond/dist/filepond.min.css";
import { Card, Table } from "react-bootstrap";
import { MediaLibraryApi, TemporaryUpload } from "../../api_client";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import TapirPagination from "../TapirPagination";
import { formatDate } from "../../utils/formatDate";
import TapirButton from "../TapirButton";

interface TemporaryUploadsCardProps {
  temporaryUploads: TemporaryUpload[];
  apiClient: MediaLibraryApi;
  updateTemporaryUploadsList: () => void;
  itemCount: number;
  currentPage: number;
  goToPage: (pageIndex: number) => void;
}

export default function TemporaryUploadsCard(props: TemporaryUploadsCardProps) {
  function onDelete(uploadId: string) {
    props.apiClient.temporaryuploadsDestroy({ uploadId: uploadId }).then(() => {
      props.updateTemporaryUploadsList();
    });
  }

  return (
    <Card className="mb-2">
      <Card.Header as="h5">Noch nicht gespeicherte Dateien</Card.Header>
      <Card.Body>
        {props.itemCount === 0 ? (
          <span className="text-muted">Keine ungespeicherten Dateien</span>
        ) : (
          <Table
            striped
            hover
            responsive
            className="align-middle mb-0"
          >
            <thead>
              <tr>
                <th>Dateiname</th>
                <th>Hochgeladen am</th>
                <th>Hochgeladen von</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {props.temporaryUploads.map((temporaryUpload) => (
                <tr key={temporaryUpload.uploadId}>
                  <td>{temporaryUpload.uploadName}</td>
                  <td className="text-nowrap">
                    {formatDate(temporaryUpload.uploaded)}
                  </td>
                  <td>{temporaryUpload.uploadedBy}</td>
                  <td>
                    <TapirButton
                      size="sm"
                      variant="outline-danger"
                      text="Löschen"
                      icon={TrashIcon}
                      onClick={() => onDelete(temporaryUpload.uploadId)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
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
  );
}
