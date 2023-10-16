import React, { useEffect, useState } from "react";
import { DummyAccountsApi, DummyPickupLocation } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Button, Card, Table } from "react-bootstrap";
import Loading from "../loading";
import Paths from "../../routing";
import { useNavigate } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";

const DummyPickupLocationCard = () => {
  const [locations, setLocations] = useState<DummyPickupLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dummyAccountsDummyPickupLocationList()
      .then(setLocations)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Locations", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleDelete(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    locationId: number,
  ) {
    event.stopPropagation();

    setLoading(true);
    api
      .dummyAccountsDummyPickupLocationDestroy({ id: locationId })
      .then(() => {
        showAlert("Location deleted", "success");
        setLocations(
          locations.filter((location) => location.id !== locationId),
        );
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Löschen der Location", "danger");
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
          <h4>Pickup locations</h4>
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
                <th>Name</th>
                <th>Delivery day</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      Paths.dummyTapirUserEdit.replace(
                        ":id",
                        location.id.toString(),
                      ),
                    )
                  }
                >
                  <td>{location.name}</td>
                  <td>{location.deliveryDay}</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={(event) => handleDelete(event, location.id)}
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

export default DummyPickupLocationCard;
