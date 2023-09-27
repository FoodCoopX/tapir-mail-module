import React, { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import {
  EmailConfigurationDispatch,
  EmailConfigurationDispatchApi,
} from "../api_client";
import { useAlert } from "../contexts/alerts";
import { useNavigate } from "react-router-dom";
import { Card, Table } from "react-bootstrap";
import Loading from "./loading";
import Paths from "../routing";
import { formatDate } from "../utils/formatDate";
import EmailConfigurationVersionStatusBadge from "./emailConfigurationVersionStatusBadge";

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
  }, []);

  return (
    <Card>
      <Card.Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h4>{cardTitle}</h4>
        </div>
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
                <th>Gesendet am</th>
                <th>Empfänger</th>
                <th>Status</th>
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
                      {emailConfigurationDispatch.recipients.map(
                        (recipient) => (
                          <div>{recipient}</div>
                        ),
                      )}
                    </td>
                    <td>
                      <EmailConfigurationVersionStatusBadge
                        status={
                          emailConfigurationDispatch.emailConfigurationVersion
                            .status!
                        }
                      />
                    </td>
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

export default EmailConfigurationDispatchTable;
