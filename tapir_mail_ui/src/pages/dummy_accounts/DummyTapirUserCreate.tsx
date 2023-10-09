import React, { useState } from "react";
import { DummyAccountsApi, DummyTapirUser } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Container } from "react-bootstrap";
import Loading from "../../components/loading";
import Paths from "../../routing";
import DummyTapirUserForm from "../../components/dummy_accounts/DummyTapirUserForm";

const DummyTapirUserCreate = () => {
  const user: DummyTapirUser = {
    id: -1,
    firstName: "",
    lastName: "",
  };
  const [loading, setLoading] = useState<boolean>(false);

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);
  const navigate = useNavigate();

  function handleSave() {
    setLoading(true);
    api
      .dummyAccountsDummyTapirUserCreate({ dummyTapirUser: user })
      .then(() => {
        showAlert("Created", "success");
        navigate(Paths.dummyAccounts);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim erzeugen der User", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Container>
      <Link to={Paths.dummyAccounts}>
        <Button
          size="sm"
          variant="secondary"
        >
          &lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Users
        </Button>
      </Link>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridGap: "2em",
          margin: "2em",
        }}
      >
        <Card>
          <Card.Header>
            <h4>Create User</h4>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <Loading />
            ) : (
              <DummyTapirUserForm
                user={user}
                onSave={handleSave}
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DummyTapirUserCreate;
