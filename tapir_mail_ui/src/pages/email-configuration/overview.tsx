import React, { useLayoutEffect, useState } from 'react'
import { Button, Modal, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { EmailConfiguration, EmailConfigurationApi } from '../../api_client'
import Loading from '../../components/loading'
import { useAlert } from '../../contexts/alerts'
import { useApi } from '../../hooks/useApi'
import Paths from '../../routing'

const MailPlanningOverview = () => {
    const api = useApi(EmailConfigurationApi)
    const showAlert = useAlert()
    const navigate = useNavigate()

    const [emailConfigurations, setEmailConfigurations] = useState<EmailConfiguration[]>([])
    const [loading, setLoading] = useState(true)
    const [sendModalOpen, setSendModalOpen] = useState(false)
    const [selectedEmailConfiguration, setSelectedEmailConfiguration] = useState<EmailConfiguration | undefined>(undefined)

    useLayoutEffect(() => {
        api.emailconfigurationsList().then(data => {
            setEmailConfigurations(data)
        }).catch(err => {
            showAlert("Beim Laden ist ein Fehler aufgetreten.", 'danger');
        }).finally(() => {
            setLoading(false)
        })
    }, [])

    const handleSendEmail = () => {
        setSendModalOpen(false)
        api.emailconfigurationsSendEmail({ id: selectedEmailConfiguration!!.id!! }).then(() => {
            showAlert("Email wurde versendet!", 'success')
        }).catch(err => {
            console.error(err)
            showAlert("Beim Versenden ist ein Fehler aufgetreten.", 'danger');
        })
    }

    const handleCloseModal = () => setSendModalOpen(false)
    return <div className="container">
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '1em' }}>
            <Link to={Paths.dashboard}><Button variant="secondary">Zurück</Button></Link>
            <h3><strong>Geplante Emails</strong></h3>
            <Link to={Paths.emailConfigurationCreate}><Button>Neu anlegen</Button></Link>
        </div>
        {loading ? <Loading /> : (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Template</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {emailConfigurations.map(ec => (
                        <tr key={ec.id} style={{ cursor: 'pointer' }}
                            onClick={() => navigate(Paths.emailConfigurationEdit.replace(':id', ec.id!!))}>
                            <td>{ec.name}</td>
                            <td>{ec.subject}</td>
                            <td>{ec.template}</td>
                            <td>{ec.createdAt.toISOString()}</td>
                            <td>{ec.updatedAt.toISOString()}</td>
                            <td onClick={(e) => {
                                e.stopPropagation()
                                setSendModalOpen(true)
                                setSelectedEmailConfiguration(ec)
                            }}><Button size='sm' variant='warning'>Senden</Button></td>
                        </tr>

                    ))}
                </tbody>
            </Table>)}

        <Modal show={Boolean(sendModalOpen)} onHide={handleCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>Email senden</Modal.Title>
            </Modal.Header>
            {selectedEmailConfiguration && <Modal.Body>Möchtest du die Email <strong>{selectedEmailConfiguration!!.name}</strong> an folgende Empfänger senden?<br />
                {selectedEmailConfiguration!!.recipients?.split(',').map(r => <>- {r}</>)}</Modal.Body>}
            <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="success" onClick={handleCloseModal}>
                    Abbrechen
                </Button>
                <Button variant="primary" onClick={handleSendEmail}>
                    Email senden
                </Button>
            </Modal.Footer>
        </Modal>
    </div>
}

export default MailPlanningOverview