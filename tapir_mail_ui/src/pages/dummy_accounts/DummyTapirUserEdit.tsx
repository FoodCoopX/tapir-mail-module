import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyTapirUser } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Container } from "react-bootstrap";
import Loading from "../../components/loading";
import Paths from "../../routing";
import DummyTapirUserForm from "../../components/dummy_accounts/DummyTapirUserForm";

const DummyTapirUserEdit = () => {
  const { id } = useParams();

  const [user, setUser] = useState<DummyTapirUser>({
    id: 0,
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    api
      .dummyAccountsDummyTapirUserRetrieve({ id: parseInt(id!) })
      .then(setUser)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der User", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  function handleSave() {
    setLoading(true);

    let apiCall;
    if (id) {
      apiCall = api.dummyAccountsDummyTapirUserUpdate({
        id: user.id,
        dummyTapirUserRequest: user,
      });
    } else {
      apiCall = api.dummyAccountsDummyTapirUserCreate({
        dummyTapirUserRequest: user,
      });
    }

    apiCall
      .then(() => {
        showAlert("Save successful", "success");
        navigate(Paths.dummyAccounts);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim speichern der User", "danger");
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
            <h4>Edit User</h4>
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

export default DummyTapirUserEdit;
