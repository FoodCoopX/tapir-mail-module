import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyContract } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Button, Card, Table } from "react-bootstrap";
import Loading from "../loading";
import Paths from "../../routing";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../../utils/formatDate";

const DummyContractsCard = () => {
  const [contracts, setContracts] = useState<DummyContract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dummyAccountsDummyContractList()
      .then(setContracts)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Verträge", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleDelete(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    contractId: number,
  ) {
    event.stopPropagation();

    setLoading(true);
    api
      .dummyAccountsDummyContractDestroy({ id: contractId })
      .then(() => {
        showAlert("Contract deleted", "success");
        setContracts(
          contracts.filter((contract) => contract.id !== contractId),
        );
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Löschen der Vertrag", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Card>
      <Card.Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h4>Verträge</h4>
          <Link to={Paths.dummyTapirUserCreate}>
            <PlusCircleIcon
              title="Create contract"
              style={{
                width: "3em",
                padding: "0.25em",
                borderRadius: "50%",
                color: "red",
              }}
            />
          </Link>
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
                <th>User</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      Paths.dummyTapirUserEdit.replace(
                        ":id",
                        contract.id.toString(),
                      ),
                    )
                  }
                >
                  <td>{contract.tapirUser.email}</td>
                  <td>{formatDate(contract.startDate)}</td>
                  <td>{formatDate(contract.endDate)}</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={(event) => handleDelete(event, contract.id)}
                    >
                      <TrashIcon
                        title="Delete"
                        style={{
                          width: "2em",
                          padding: "0.25em",
                          borderRadius: "50%",
                          color: "white",
                        }}
                      />
                    </Button>
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

export default DummyContractsCard;
