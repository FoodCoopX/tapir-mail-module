import React, { useLayoutEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { EmailTemplate, EmailTemplateApi } from '../api_client';
import { useApi } from '../hooks/useApi';

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
            <Link to={`/media_library/`}><Button variant="link" style={{ margin: '1em', width: '20em' }}>Media library</Button></Link>

            <Link to="/mailing/new">
                <Button variant="primary">
                    Neues Mailing anlegen
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
                    return <Link key={template.id} to={"/editor/" + template.id}>
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