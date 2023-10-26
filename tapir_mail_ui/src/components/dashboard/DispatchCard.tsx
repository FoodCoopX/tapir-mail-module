import React, { useEffect, useState } from "react";
import { EmailDispatch, EmailDispatchApi } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Card, Table } from "react-bootstrap";
import Loading from "../loading";
import { formatDate } from "../../utils/formatDate";

const DispatchCard = () => {
  const [dispatches, setDispatches] = useState<EmailDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(EmailDispatchApi);

  useEffect(() => {
    const fetch = () =>
      api
        .emailDispatchList()
        .then(setDispatches)
        .catch((err) => {
          console.error(err);
          showAlert("Fehler beim Laden der Vorlagen", "danger");
        })
        .finally(() => {
          setLoading(false);
        });

    fetch();

    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
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
          <h4>Versand-Details</h4>
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
                <th>Empfänger</th>
                <th>Gesendet am</th>
                <th>Geöffnet am</th>
                <th>Config</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((dispatch) => (
                <tr key={dispatch.id}>
                  <td>{dispatch.recipient}</td>
                  <td>{formatDate(dispatch.sentTime)}</td>
                  <td>{formatDate(dispatch.openedTime)}</td>
                  <td>
                    {
                      dispatch.emailConfigurationDispatch
                        .emailConfigurationVersion.emailConfiguration.name
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default DispatchCard;
