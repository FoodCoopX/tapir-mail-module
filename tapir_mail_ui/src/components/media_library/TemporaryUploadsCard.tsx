import React from 'react';

import 'filepond/dist/filepond.min.css';
import {Button, Card, Table} from "react-bootstrap";
import {MediaLibraryApi, TemporaryUpload} from "../../api_client";

interface TemporaryUploadsCardProps {
    temporaryUploads: TemporaryUpload[]
    apiClient: MediaLibraryApi
    updateTemporaryUploadsList: () => void
}

export default function TemporaryUploadsCard(props: TemporaryUploadsCardProps) {
    function onDelete(uploadId: string) {
        props.apiClient.temporaryuploadsDestroy({"uploadId": uploadId})
            .then(() => {
                props.updateTemporaryUploadsList();
            });
    }

    return <Card className="mb-2">
        <Card.Header as="h5">Temporary uploads</Card.Header>
        <Card.Body>
            {props.temporaryUploads &&
                <Table striped hover>
                    <thead>
                    <tr>
                        <th>Index</th>
                        <th>File</th>
                        <th>File ID</th>
                        <th>Upload ID</th>
                        <th>Upload name</th>
                        <th>Upload type</th>
                        <th>Uploaded</th>
                        <th>Uploaded by</th>
                        <th>Delete</th>
                    </tr>
                    </thead>
                    <tbody>
                    {props.temporaryUploads.map((temporaryUpload, index) => {
                        return (
                            <tr key={temporaryUpload.uploadId}>
                                <td>#{index + 1}</td>
                                <td>{temporaryUpload.file}</td>
                                <td>{temporaryUpload.fileId}</td>
                                <td>{temporaryUpload.uploadId}</td>
                                <td>{temporaryUpload.uploadName}</td>
                                <td>{temporaryUpload.uploadType}</td>
                                <td>{temporaryUpload.uploaded.toString()}</td>
                                <td>{temporaryUpload.uploadedBy}</td>
                                <td><Button onClick={() => onDelete(temporaryUpload.uploadId)}>Delete</Button></td>
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