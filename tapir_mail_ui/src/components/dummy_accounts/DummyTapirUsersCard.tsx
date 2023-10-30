import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyTapirUser } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Card, Table } from "react-bootstrap";
import Loading from "../loading";
import Paths from "../../routing";
import { Link, useNavigate } from "react-router-dom";
import { TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import TapirButton from "../TapirButton";

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

    api
      .dummyAccountsDummyTapirUserDestroy({ id: userId })
      .then(() => {
        showAlert("User deleted", "success");
        setUsers(users.filter((user) => user.id !== userId));
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Löschen der Users", "danger");
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
            <TapirButton
              variant="primary"
              icon={UserIcon}
              text={"Create user"}
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
                    <TapirButton
                      variant="danger"
                      text=""
                      icon={TrashIcon}
                      onClick={(event) => handleDelete(event, user.id)}
                    />
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
