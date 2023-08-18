import React from 'react';

import 'filepond/dist/filepond.min.css';
import {Button, Card, Table} from "react-bootstrap";
import {MediaLibraryApi, StoredUpload} from "../../api_client";

interface StoredUploadsCardProps {
    storedUploads: StoredUpload[]
    apiClient: MediaLibraryApi
    updateStoredUploadsList: () => void
}

export default function StoredUploadsCard(props: StoredUploadsCardProps) {
    function onDelete(uploadId: string) {
        props.apiClient.storeduploadsDestroy({"uploadId": uploadId})
            .then(() => {
                props.updateStoredUploadsList();
            });
    }

    return <Card className="mb-2">
        <Card.Header as="h5">Stored uploads</Card.Header>
        <Card.Body>
            {props.storedUploads &&
                <Table striped hover>
                    <thead>
                    <tr>
                        <th>Index</th>
                        <th>File</th>
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
                                <td>{storedUpload.file}</td>
                                <td>{storedUpload.uploadId}</td>
                                <td>{storedUpload.uploaded.toString()}</td>
                                <td>{storedUpload.stored.toString()}</td>
                                <td>{storedUpload.uploadedBy}</td>
                                <td><Button onClick={() => onDelete(storedUpload.uploadId)}>Delete</Button></td>
                            </tr>
                        );
                    })
                    }
                    </tbody>
                </Table>
            }
        </Card.Body>
    </Card>
}