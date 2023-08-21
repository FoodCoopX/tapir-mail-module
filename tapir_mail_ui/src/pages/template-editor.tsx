import { BasicType, BlockManager, JsonToMjml } from "easy-email-core";
import { IEmailTemplate } from "easy-email-editor";
import mjml from 'mjml-browser';
import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Editor from "../component/editor";

const TemplateEditor = ({ template = {
    id: '',
    name: '',
    content: BlockManager.getBlockByType(BasicType.PAGE)!.create({})
} }: {
    template: {
        id: string,
        name: string,
        content: any
    }
}) => {
    const navigate = useNavigate();
    const [showSaveGateModal, setShowSaveGateModal] = useState(false);

    const handleContentChange = (values: IEmailTemplate) => {
        console.log(values)
    }

    const handleBack = (values: IEmailTemplate) => {
        if (values.content != template.content) {
            setShowSaveGateModal(true);
        } else {
            navigate('/')
        }
    }

    const handleSave = (values: IEmailTemplate) => {
        // TODO: generate HTML in backend
        const html: string = mjml(JsonToMjml({
            data: values.content,
            mode: 'production',
            context: values.content
        }), {
            beautify: false,
            validationLevel: 'soft',
        }).html.replaceAll('\n', '').replaceAll('\t', '').replaceAll('  ', '');

        fetch('http://localhost:8000/api/demo/templates/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/html'
            },
            body: JSON.stringify({
                name: template.name,
                json: values.content,
                html: html
            })
        }).then(res => {
            alert("Saved")
        })
    };

    const handleCloseModal = () => setShowSaveGateModal(false);
    return (
        <>
            <Modal show={showSaveGateModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Achtung!</Modal.Title>
                </Modal.Header>
                <Modal.Body>Du hast <strong>ungespeicherte Änderungen</strong>!<br />Möchtest du deine Änderungen wirklich verwerfen?</Modal.Body>
                <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="danger" onClick={() => navigate('/')}>
                        Änderungen verwerfen
                    </Button>
                    <Button variant="success" onClick={handleCloseModal}>
                        Weiter Editieren
                    </Button>
                </Modal.Footer>
            </Modal>
            <Editor handleBack={handleBack} handleSave={handleSave} onContentChange={handleContentChange} />
        </>
    )

}

export default TemplateEditor;