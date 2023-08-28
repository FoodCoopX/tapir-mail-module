import { IEmailTemplate } from "easy-email-editor";
import React, { useLayoutEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { EmailConfigurationApi, EmailTemplate, EmailTemplateApi } from "../../api_client";
import Editor, { EMPTY_PAGE } from "../../components/editor";
import Loading from "../../components/loading";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { mjmlToHtml } from "../../utils/mjml";

const ID_NEW_TEMPLATE = '<new>'

const EmailConfigurationEditor = () => {
    const { id } = useParams();

    const [loading, setLoading] = useState<Boolean>(Boolean(id));
    const [mailingName, setMailingName] = useState("");
    const [subject, setSubject] = useState("")
    const [subtitle, setSubtitle] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState<string>(ID_NEW_TEMPLATE);
    const [recipients, setRecipients] = useState("");
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loadedContent, setLoadedContent] = useState<any | undefined>(EMPTY_PAGE)
    const [templateName, setTemplateName] = useState("")
    const [content, setContent] = useState<any | undefined>(undefined)

    const showAlert = useAlert();

    const templateApi = useApi(EmailTemplateApi)
    const emailConfigApi = useApi(EmailConfigurationApi)


    const fetchTemplates = () => templateApi.emailtemplatesList()
        .then(data => {
            setTemplates(data)
        })

    useLayoutEffect(() => {
        fetchTemplates().then(() => {
            if (id) {
                emailConfigApi.emailconfigurationsRetrieve({ id: id }).then(data => {
                    setMailingName(data.name)
                    setSubject(data.subject)
                    setSubtitle(data.subtitle || "")
                    setRecipients(data.recipients || "")
                    handleSelectTemplate({ target: { value: data.template } })
                }).catch(err => {
                    showAlert("Beim Laden ist ein Fehler aufgetreten.", 'danger');
                })
            }
        }).catch(err => {
            showAlert("Beim Laden ist ein Fehler aufgetreten.", 'danger');
        })
    }, [id]);


    const handleSave = () => {
        const props = {
            emailConfigurationCreate: {
                name: mailingName,
                subject: subject,
                subtitle: subtitle,
                template: selectedTemplate!!,
                recipients: recipients
            }
        }

        if (id) {
            emailConfigApi.emailconfigurationsUpdate({
                id: id,
                ...props
            }).then(data => {
                showAlert("Deine Änderungen wurden gespeichert!", 'success')
            }).catch(err => {
                showAlert(`Beim Speichern ist ein Fehler aufgetreten.`, 'danger');
            })
        } else {
            emailConfigApi.emailconfigurationsCreate(props).then(data => {
                showAlert("Deine Email Konfiguration wurde gespeichert!", 'success')
            }).catch(err => {
                showAlert(`Beim Speichern ist ein Fehler aufgetreten.`, 'danger');
            })
        }
    }

    const handleSaveTemplate = (values: IEmailTemplate) => {
        const props = {
            emailTemplateCreate: {
                name: templateName,
                content: JSON.stringify(values.content),
                html: mjmlToHtml(values.content)
            }
        }
        if (selectedTemplate !== ID_NEW_TEMPLATE) {
            // update template
            templateApi.emailtemplatesUpdate({
                id: selectedTemplate,
                ...props
            }).then(data => {
                showAlert("Template gespeichert", "success")
                setLoadedContent(JSON.parse(data.content))
            }).catch(err => {
                showAlert("Fehler beim Speichern", "danger")
            })
        } else {
            // create template
            templateApi.emailtemplatesCreate(props).then(data => {
                showAlert("Template gespeichert", "success")
                setLoadedContent(JSON.parse(data.content))
                fetchTemplates()
                setSelectedTemplate(data.id!!)
            }).catch(err => {
                showAlert("Fehler beim Speichern", "danger")
            })
        }
    }

    const handleSelectTemplate = (e: any) => {
        const id = e.target.value
        if (id !== ID_NEW_TEMPLATE) {
            templateApi.emailtemplatesRetrieve({ id: id!! }).then(data => {
                setLoadedContent(JSON.parse(data.content))
                setTemplateName(data.name)
                setSelectedTemplate(id)
            }).catch(err => {
                setSelectedTemplate(ID_NEW_TEMPLATE)
                showAlert("Beim Laden des Templates ist ein Fehler aufgetreten.", 'danger');
            }).finally(() => {
                setLoading(false)
            })
        } else {
            setLoadedContent(EMPTY_PAGE)
            setTemplateName(mailingName)
            setSelectedTemplate(ID_NEW_TEMPLATE)
            setLoading(false)
        }
    }

    const handleEditorChange = (values: IEmailTemplate) => {
        setContent(values.content)
    }

    const saveButtonDisabled = !mailingName || !selectedTemplate || !subject || (content != loadedContent) || loadedContent === EMPTY_PAGE
    return loading ? <Loading /> : (
        <div style={{ display: 'grid', gridTemplateColumns: "1fr 5fr" }}>
            <div style={{ margin: '1em' }}>
                <Link to={Paths.emailConfiguration}><Button size="sm" style={{ width: '100%' }} variant="secondary">&lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Übersicht</Button></Link>
                <hr />
                <Form>
                    <Form.Group>
                        <Form.Label>Name für das Mailing</Form.Label>
                        <Form.Control
                            required={true}
                            className={mailingName ? "" : "is-invalid"}
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
                            className={subject ? "" : "is-invalid"}
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
                        <Form.Control as="select" value={selectedTemplate || ID_NEW_TEMPLATE} onChange={handleSelectTemplate}>
                            <option value={ID_NEW_TEMPLATE}>Neue Mail erstellen</option>
                            {templates.map((t: EmailTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Empfänger</Form.Label>
                        <Form.Control
                            type="text"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                        />
                    </Form.Group>
                    <br />

                    <Form.Group>
                        <Form.Label>Versandzeitpunkt</Form.Label>
                        <Form.Control as="select" value="now" readOnly={true} disabled={true}>
                            <option value="now">Sofort</option>
                        </Form.Control>
                    </Form.Group>

                    <hr />
                    <Button
                        disabled={saveButtonDisabled}
                        variant={saveButtonDisabled ? "disabled" : "success"}
                        style={{ width: '100%' }}
                        onClick={handleSave}>Konfiguration speichern</Button>
                    {saveButtonDisabled && <Alert style={{ margin: '1em' }} variant="warning"><small>Bitte speichere zuerst das Template.</small></Alert>}
                </Form>
            </div>
            <div>
                <Editor content={loadedContent} onSave={handleSaveTemplate} templateName={templateName} onTemplateNameChange={(name) => setTemplateName(name)} subject={subject} subtitle={subtitle} onContentChange={handleEditorChange} />
            </div>
        </div>
    );
}


export default EmailConfigurationEditor;