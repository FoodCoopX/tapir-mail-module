import { PlusCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Badge, Card, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { EmailConfiguration, EmailConfigurationApi } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { EMAIL_CONFIGURATION_VERSION_STATUS_PROPS } from "../../utils/emailConfigurationVersionStatusProps";
import { formatDate } from "../../utils/formatDate";
import TapirButton from "../TapirButton";
import Loading from "../loading";
import SelectVersionModal from "./SelectVersionModal";

const EmailConfigurationTable = () => {
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [emailConfigurations, setEmailConfigurations] = useState<
    EmailConfiguration[]
  >([]);
  const [selectedEmailConfiguration, setSelectedEmailConfiguration] =
    useState<EmailConfiguration | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const api = useApi(EmailConfigurationApi);

  const fetchEmailConfigurations = () =>
    api
      .emailConfigurationList()
      .then((data) => {
        setEmailConfigurations(data);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Beim Laden ist ein Fehler aufgetreten.", "danger");
      })
      .finally(() => {
        setLoading(false);
      });

  useEffect(() => {
    if (!api || !showAlert) return;

    fetchEmailConfigurations();
  }, []);

  const handleSelectEmailConfiguration = (ec: EmailConfiguration) => {
    setSelectedEmailConfiguration(ec);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => setEditModalOpen(false);

  return (
    <>
      <Card>
        <Card.Header
          as="h5"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>E-Mails</span>
          <Link to={Paths.emailConfigurationCreate}>
            <TapirButton
              variant="primary"
              text="Neue E-Mail erstellen"
              icon={PlusCircleIcon}
            />
          </Link>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          {loading ? (
            <Loading />
          ) : (
            <Table
              striped
              bordered
              hover
            >
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Erstellt am</th>
                  <th>Veröffentlicht am</th>
                  <th>Letzter Entwurf aktualisiert am</th>
                </tr>
              </thead>
              <tbody>
                {emailConfigurations.map((emailConfiguration) => (
                  <tr
                    key={emailConfiguration.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      handleSelectEmailConfiguration(emailConfiguration)
                    }
                  >
                    <td>{emailConfiguration.name}</td>
                    <td>{formatDate(emailConfiguration.createdAt)}</td>
                    <td>
                      {emailConfiguration.releasedDate && (
                        <Badge
                          bg={
                            EMAIL_CONFIGURATION_VERSION_STATUS_PROPS.released
                              .color
                          }
                          pill={true}
                        >
                          {formatDate(emailConfiguration.releasedDate)}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {emailConfiguration.lastUpdatedDraftDate && (
                        <Badge
                          bg={
                            EMAIL_CONFIGURATION_VERSION_STATUS_PROPS.draft.color
                          }
                          pill={true}
                        >
                          {formatDate(emailConfiguration.lastUpdatedDraftDate)}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <SelectVersionModal
        open={editModalOpen}
        emailConfiguration={selectedEmailConfiguration!!}
        onClose={handleCloseEditModal}
        onDataChanged={fetchEmailConfigurations}
      />
    </>
  );
};

export default EmailConfigurationTable;
