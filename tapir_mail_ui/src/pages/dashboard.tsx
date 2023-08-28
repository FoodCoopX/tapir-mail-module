import React, { useLayoutEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { EmailTemplate, EmailTemplateApi } from '../api_client';
import { useApi } from '../hooks/useApi';
import Paths from '../routing';
import Loading from '../components/loading';

function Dashboard() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const apiClient = useApi(EmailTemplateApi)

    useLayoutEffect(() => {
        apiClient.emailtemplatesList().then(data => {
            setTemplates(data)
        })
    }, [])


    return <>
        <div className="container" style={{ margin: 'auto', marginTop: '2em', display: 'flex', justifyContent: 'space-evenly' }}>
            <Link to={Paths.mediaLibrary}><Button variant="link" style={{ margin: '1em', width: '20em' }}>Media library</Button></Link>
            <Link to={Paths.emailConfiguration}>
                <Button variant="primary">
                    Email Definitionen
                </Button>
            </Link>

            <hr />

            <Link to="/editor">
                <Button variant="primary">
                    Neues Template designen
                </Button>
            </Link>

            <div>
                {templates.map(template => {
                    return <Link key={template.id} to={Paths.templateEditorEdit.replace(":templateId", template.id!!)}>
                        <ul>
                            <li>{template.name}</li>
                        </ul>
                    </Link>
                })}
            </div>
        </div>
    </>
}

export default Dashboard