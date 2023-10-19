import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyTapirUser } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Button, Card, Table } from "react-bootstrap";
import Loading from "../loading";
import Paths from "../../routing";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

const DummyTapirUsersCard = () => {
  const [users, setUsers] = useState<DummyTapirUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dummyAccountsDummyTapirUserList()
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Users", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleDelete(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    userId: number,
  ) {
    event.stopPropagation();

    setLoading(true);
    api
      .dummyAccountsDummyTapirUserDestroy({ id: userId })
      .then(() => {
        showAlert("User deleted", "success");
        setUsers(users.filter((user) => user.id !== userId));
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Löschen der Users", "danger");
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
          <h4>Users</h4>
          <Link to={Paths.dummyTapirUserCreate}>
            <PlusCircleIcon
              title="Create user"
              style={{
                width: "3em",
                padding: "0.25em",
                borderRadius: "50%",
                color: "green",
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
                <th>Email</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Pickup location</th>
                <th>Has shares</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      Paths.dummyTapirUserEdit.replace(
                        ":id",
                        user.id.toString(),
                      ),
                    )
                  }
                >
                  <td>{user.email}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.pickupLocation.name}</td>
                  <td>{user.hasCoopShares ? "Yes" : "No"}</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={(event) => handleDelete(event, user.id)}
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

export default DummyTapirUsersCard;
