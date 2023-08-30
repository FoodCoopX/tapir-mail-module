import React from "react";

import "filepond/dist/filepond.min.css";
import { Button, Card, Table } from "react-bootstrap";
import { MediaLibraryApi, StoredUpload } from "../../api_client";
import { getMediaLibraryFileUrl } from "../../utils/getMediaLibraryFileUrl";

interface StoredUploadsCardProps {
  storedUploads: StoredUpload[];
  apiClient: MediaLibraryApi;
  updateStoredUploadsList: () => void;
}

export default function StoredUploadsCard(props: StoredUploadsCardProps) {
  function onDelete(uploadId: string) {
    props.apiClient.storeduploadsDestroy({ uploadId: uploadId }).then(() => {
      props.updateStoredUploadsList();
    });
  }

  function getFilePreview(storedUpload: StoredUpload) {
    const fileExtension = storedUpload.fileName.split(".").pop();
    if (fileExtension && ["png", "jpg", "jpeg"].includes(fileExtension)) {
      return (
        <img
          src={getMediaLibraryFileUrl(storedUpload.uploadId)}
          style={{ maxHeight: "100px", maxWidth: "100px" }}
          alt="Image preview"
        ></img>
      );
    }
    return <>No preview available for file extension: {fileExtension}</>;
  }

  return (
    <Card className="mb-2">
      <Card.Header as="h5">Stored uploads</Card.Header>
      <Card.Body>
        {props.storedUploads && (
          <Table
            striped
            hover
          >
            <thead>
              <tr>
                <th>Index</th>
                <th>Preview</th>
                <th>File name</th>
                <th>URL</th>
                <th>Upload ID</th>
                <th>Uploaded at</th>
                <th>Stored at</th>
                <th>Uploaded by</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {props.storedUploads.map((storedUpload, index) => {
                return (
                  <tr key={storedUpload.uploadId}>
                    <td>#{index + 1}</td>
                    <td>{getFilePreview(storedUpload)}</td>
                    <td>{storedUpload.fileName.split("/").slice(-1)}</td>
                    <td>
                      <a href={getMediaLibraryFileUrl(storedUpload.uploadId)}>
                        {getMediaLibraryFileUrl(storedUpload.uploadId)}
                      </a>
                    </td>
                    <td>{storedUpload.uploadId}</td>
                    <td>{storedUpload.uploaded.toString()}</td>
                    <td>{storedUpload.stored.toString()}</td>
                    <td>{storedUpload.uploadedBy}</td>
                    <td>
                      <Button onClick={() => onDelete(storedUpload.uploadId)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
