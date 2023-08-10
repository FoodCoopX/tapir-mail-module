import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [templates, setTemplates] = React.useState([])
    useEffect(() => {
        fetch('http://localhost:8000/api/demo/templates/list').then(res => res.json()).then(data => {
            setTemplates(data.templates)
        })
    }, []);

    return <>
        <NewTemplateModalForm show={showNewTemplateModal} onHide={() => setShowNewTemplateModal(false)} />
        <div className="container" style={{ margin: 'auto', marginTop: '2em' }}>
            <Button onClick={() => setShowNewTemplateModal(true)} variant="primary">
                Neues Design anlegen
            </Button>

            <h1 style={{ marginTop: '2em' }}>Bestehende Designs editieren:</h1>
            {templates.map((t) => <><Link to={`/editor/${t}`}><Button variant="warning" style={{ margin: '1em', width: '20em' }}>{t}</Button></Link></>)}
        </div>
    </>
}

type NewTemplateModalFormProps = {
    show: boolean;
    onHide: () => void;
}
const NewTemplateModalForm: React.FC<NewTemplateModalFormProps> = ({ show, onHide }) => {
    const navigate = useNavigate();

    function makeUrlFriendly(str: string) {
        return str
            .toLowerCase()                       // Convert the string to lowercase
            .replace(/\s+/g, '-')               // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '')         // Remove all non-alphanumeric characters except hyphens
            .replace(/--+/g, '-')               // Replace multiple hyphens with a single hyphen
            .replace(/^-+/, '')                 // Trim leading hyphens
    }

    const [templateName, setTemplateName] = useState('')
    const handleSubmit = () => navigate(`/editor/${templateName}`)
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Neues Template anlegen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="templateName">
                        <Form.Label>Template Name (intern)</Form.Label>
                        <Form.Control
                            value={templateName}
                            onChange={(e) => setTemplateName(makeUrlFriendly(e.target.value))}
                            type="text"
                            placeholder="mein-template" />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="secondary" onClick={() => onHide()}>
                    Abbrechen
                </Button>
                <Button
                    disabled={templateName.length === 0}
                    variant="success"
                    onClick={handleSubmit}>
                    Neues Template anlegen
                </Button>
            </Modal.Footer>
        </Modal>

    );
}

export default Dashboard