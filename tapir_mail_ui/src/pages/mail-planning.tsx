import {
    IEmailTemplate
} from 'easy-email-editor';
import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import API from "../api";
import Editor from "../component/editor";

const MailPlanning = () => {
    const [mailingName, setMailingName] = useState("");
    const [subject, setSubject] = useState("")
    const [subtitle, setSubtitle] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [recipient, setRecipient] = useState("");
    const [templates, setTemplates] = useState([])
    const [loadedContent, setLoadedContent] = useState<any | undefined>(undefined)
    const [content, setContent] = useState<any | undefined>(undefined)

    useEffect(() => {
        API.getTemplates().then(data => {
            setTemplates(data.templates)
        })
    }, []);

    useEffect(() => {
        if (selectedTemplate !== '<new>') {
            API.getTemplate(selectedTemplate)
                .then(data => {
                    setLoadedContent(data)
                })
        } else {
            setLoadedContent(undefined)
        }
    }, [selectedTemplate])

    const handleEditorChange = (values: IEmailTemplate) => {
      //  setContent(values.content)
    }

    const handleSendMail = () => {
        API.sendMail({
            mailingName,
            subject,
            subtitle,
            recipient,
            content
        })
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: "1fr 5fr" }}>
            <div style={{ margin: '1em' }}>
                <Link to="/"><Button size="sm" style={{ width: '100%' }} variant="secondary">&lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Übersicht</Button></Link>
                <hr />
                <Form>
                    <Form.Group>
                        <Form.Label>Name für das Mailing</Form.Label>
                        <Form.Control
                            required={true}
                            type="text"
                            value={mailingName}
                            onChange={(e) => setMailingName(e.target.value)}
                        />
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Betreff</Form.Label>
                        <Form.Control
                            required={true}
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Untertitel (2. Betreffzeile)</Form.Label>
                        <Form.Control
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Template auswählen</Form.Label>
                        <Form.Control as="select" value={selectedTemplate || 'new'} onChange={(e) => setSelectedTemplate(e.target.value)}>
                            <option value="<new>">Neue Mail erstellen</option>
                            {templates.map(t => <option value={t}>{t}</option>)}
                        </Form.Control>
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Empfänger</Form.Label>
                        <Form.Control
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                    </Form.Group>
                    <br />
                    <Button variant="success" style={{ width: '100%' }} onClick={handleSendMail}>Mail senden</Button>
                </Form>
            </div>
            <div>
                <Editor content={loadedContent} subject={subject} subtitle={subtitle} onContentChange={handleEditorChange} />
            </div>
        </div>
    );
}


export default MailPlanning;