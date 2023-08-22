import React, {useEffect, useState} from 'react';
import {Button, Form, Modal} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';

function Dashboard() {
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

    return <>
        <NewTemplateModalForm show={showNewTemplateModal} onHide={() => setShowNewTemplateModal(false)} />
        <div className="container" style={{ margin: 'auto', marginTop: '2em', display: 'flex', justifyContent: 'space-evenly' }}>
            <Button onClick={() => setShowNewTemplateModal(true)} variant="primary">
                Neues Template designen
            </Button>

            <h1 style={{ marginTop: '2em' }}>Bestehende Designs editieren:</h1>
            {templates.map((t) => <><Link to={`/editor/${t}`}><Button variant="warning" style={{ margin: '1em', width: '20em' }}>{t}</Button></Link></>)}
            <br />
            <Link to={`/media_library/`}><Button variant="link" style={{ margin: '1em', width: '20em' }}>Media library</Button></Link>
        
          <Link to="/mailing/new">
                <Button onClick={() => setShowNewTemplateModal(true)} variant="primary">
                    Neues Mailing anlegen
                </Button>
            </Link>
        </div>
    </>
}

type NewTemplateModalFormProps = {
    show: boolean;
    onHide: () => void;
}
const NewTemplateModalForm: React.FC<NewTemplateModalFormProps> = ({ show, onHide }) => {
    const navigate = useNavigate();

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
                        <Form.Label>Template Name</Form.Label>
                        <Form.Control
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            type="text"
                            placeholder="" />
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