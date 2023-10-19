import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyPickupLocation } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Container } from "react-bootstrap";
import Loading from "../../components/loading";
import Paths from "../../routing";
import DummyPickupLocationForm from "../../components/dummy_accounts/DummyPickupLocationForm";

const DummyPickupLocationEdit = () => {
  const { id } = useParams();

  const [location, setLocation] = useState<DummyPickupLocation>({
    id: 0,
    name: "default name",
    deliveryDay: 0,
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
      .dummyAccountsDummyPickupLocationRetrieve({ id: parseInt(id!) })
      .then(setLocation)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Location", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  function handleSave() {
    setLoading(true);

    let apiCall;
    if (id) {
      apiCall = api.dummyAccountsDummyPickupLocationUpdate({
        id: location.id,
        dummyPickupLocationRequest: location,
      });
    } else {
      apiCall = api.dummyAccountsDummyPickupLocationCreate({
        dummyPickupLocationRequest: location,
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
            <h4>Edit pickup location</h4>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <Loading />
            ) : (
              <DummyPickupLocationForm
                location={location}
                onSave={handleSave}
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DummyPickupLocationEdit;
