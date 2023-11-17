import React, { useEffect, useState } from "react";
import { EmailConfiguration, EmailConfigurationApi } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { Badge, Card, Table } from "react-bootstrap";
import Loading from "../loading";
import { formatDate } from "../../utils/formatDate";
import { EMAIL_CONFIGURATION_VERSION_STATUS_PROPS } from "../../utils/emailConfigurationVersionStatusProps";
import { useApi } from "../../hooks/useApi";
import SelectVersionModal from "./SelectVersionModal";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import TapirButton from "../TapirButton";
import Paths from "../../routing";
import { Link } from "react-router-dom";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import TapirTooltip from "../TapirTooltip";

const EmailConfigurationTable = () => {
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [emailConfigurations, setEmailConfigurations] = useState<
    EmailConfiguration[]
  >([]);
  const [selectedEmailConfiguration, setSelectedEmailConfiguration] =
    useState<EmailConfiguration | null>(null);
  const [configurationToDelete, setConfigurationToDelete] =
    useState<EmailConfiguration>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const api = useApi(EmailConfigurationApi);

  useEffect(() => {
    if (!api || !showAlert) return;

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
  }, []);

  const handleSelectEmailConfiguration = (ec: EmailConfiguration) => {
    setSelectedEmailConfiguration(ec);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => setEditModalOpen(false);

  const onDeleteTemplateConfirmed = () => {
    if (!configurationToDelete) return;

    api
      .emailConfigurationDestroy({ id: configurationToDelete.id! })
      .then(() => {
        showAlert("E-Mail gelöscht : " + configurationToDelete.name, "success");
        setEmailConfigurations(
          emailConfigurations.filter(
            (config) => config.id !== configurationToDelete.id,
          ),
        );
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim löschen des E-Mail", "danger");
      })
      .finally(() => {
        setConfigurationToDelete(undefined);
      });
  };

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
                  <th></th>
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
                    <td className="d-flex justify-content-center">
                      <TapirTooltip
                        id={"delete-button-config" + emailConfiguration.id}
                        text={
                          "Diese E-Mail kann nicht gelöscht werden weil manche Versionen schon geschickt worden sind."
                        }
                        enabled={!emailConfiguration.canBeDeleted}
                      >
                        <TapirButton
                          variant={"danger"}
                          text={""}
                          icon={TrashIcon}
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfigurationToDelete(emailConfiguration);
                          }}
                          disabled={!emailConfiguration.canBeDeleted}
                        />
                      </TapirTooltip>
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
      />
      <ConfirmDeleteModal
        message={
          "Wollen Sie wirklich die E-Mail " +
          configurationToDelete?.name +
          " löschen? Alle damit verbundene Versionen und Versand werden auch gelöscht."
        }
        open={!!configurationToDelete}
        onConfirm={onDeleteTemplateConfirmed}
        onCancel={() => {
          setConfigurationToDelete(undefined);
        }}
      />
    </>
  );
};

export default EmailConfigurationTable;
