import React, { useEffect, useState } from "react";
import { Card, ProgressBar, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  EmailConfigurationDispatch,
  EmailConfigurationDispatchApi,
} from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import Paths from "../../routing";
import { formatDate } from "../../utils/formatDate";
import Loading from "../loading";

interface EmailConfigurationVersionStatusTableProps {
  cardTitle: string;
  content: "last-sent" | "next-sends";
}

const EmailConfigurationDispatchTable: React.FC<
  EmailConfigurationVersionStatusTableProps
> = ({ cardTitle, content }) => {
  const api = useApi(EmailConfigurationDispatchApi);
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [emailConfigurationDispatches, setEmailConfigurationDispatches] =
    useState<EmailConfigurationDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = () => {
      let call;
      switch (content) {
        case "last-sent":
          call = api.emailConfigurationDispatchLastSentList.bind(api);
          break;
        case "next-sends":
          call = api.emailConfigurationDispatchNextSendsList.bind(api);
          break;
      }

      call({ limit: 10 })
        .then(setEmailConfigurationDispatches)
        .catch((err) => {
          console.error(err);
          showAlert(
            "Error loading the emails : " + content, //TODO translation
            "danger",
          );
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <Card.Header
        as="h5"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{cardTitle}</span>
      </Card.Header>
      <Card.Body style={{ padding: 0, border: "none" }}>
        {loading ? (
          <Loading />
        ) : (
          <Table
            striped
            hover
            style={{ margin: "0" }}
          >
            <thead>
              <tr>
                <th>Name des Mailings</th>
                <th>Betreff</th>
                {content === "last-sent" && (
                  <>
                    <th>Gesendet am</th>
                    <th>Empfänger</th>
                    <th>Öffnungsrate</th>
                  </>
                )}
                {content === "next-sends" && (
                  <>
                    <th>Versandzeitpunkt</th>
                    <th>Empfänger</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {emailConfigurationDispatches.map(
                (emailConfigurationDispatch) => (
                  <tr
                    style={{ cursor: "pointer" }}
                    key={content + "-" + emailConfigurationDispatch.id}
                    onClick={() =>
                      navigate(
                        Paths.emailConfigurationEdit.replace(
                          ":id",
                          emailConfigurationDispatch.emailConfigurationVersion
                            .id!!,
                        ),
                      )
                    }
                  >
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .emailConfiguration.name
                      }
                    </td>
                    <td>
                      {
                        emailConfigurationDispatch.emailConfigurationVersion
                          .subject
                      }
                    </td>
                    <td>
                      {formatDate(emailConfigurationDispatch.scheduledTime)}
                    </td>
                    <td>
                      {/* FIXME: */}
                      {emailConfigurationDispatch.overrideRecipients
                        ? JSON.stringify(
                            emailConfigurationDispatch.overrideRecipients,
                          )
                        : JSON.stringify(
                            emailConfigurationDispatch.emailConfigurationVersion
                              .segmentData,
                          )}
                    </td>
                    {content === "last-sent" && (
                      <td style={{ padding: "0.1em", margin: "0" }}>
                        <EmailConfigurationDispatchStatsColumn
                          emailConfigurationDispatch={
                            emailConfigurationDispatch
                          }
                        />
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

const EmailConfigurationDispatchStatsColumn: React.FC<{
  emailConfigurationDispatch: EmailConfigurationDispatch;
}> = ({ emailConfigurationDispatch }) => {
  return (
    <>
      <small>
        <strong>
          {emailConfigurationDispatch.sentCount
            ? Math.round(
                (emailConfigurationDispatch.openedCount /
                  emailConfigurationDispatch.sentCount) *
                  100,
              )
            : 0}
          &nbsp;%
        </strong>
        &nbsp;&nbsp;&nbsp;(
        <strong>{emailConfigurationDispatch.openedCount}</strong>/
        <span style={{ color: "darkred" }}>
          {emailConfigurationDispatch.errorCount}
        </span>
        /{emailConfigurationDispatch.sentCount})
      </small>
      <ProgressBar style={{ height: "0.75em" }}>
        <ProgressBar
          title={"Geöffnet: " + emailConfigurationDispatch.openedCount}
          variant="success"
          now={emailConfigurationDispatch.openedCount * 100}
          key={1}
        />
        <ProgressBar
          title={"Fehler: " + emailConfigurationDispatch.errorCount}
          variant="danger"
          now={emailConfigurationDispatch.errorCount * 100}
          key={3}
        />
        <ProgressBar
          title={
            "Nicht geöffnet: " +
            (emailConfigurationDispatch.sentCount -
              emailConfigurationDispatch.openedCount -
              emailConfigurationDispatch.errorCount)
          }
          variant="warning"
          now={
            (emailConfigurationDispatch.sentCount -
              emailConfigurationDispatch.openedCount -
              emailConfigurationDispatch.errorCount) *
            100
          }
          key={2}
        />
      </ProgressBar>
    </>
  );
};

export default EmailConfigurationDispatchTable;
