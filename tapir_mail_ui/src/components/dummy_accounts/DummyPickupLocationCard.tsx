import React, { useEffect, useState } from "react";
import {
  DummyAccountsApi,
  DummyPickupLocation,
  Weekday,
} from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { Card, Table } from "react-bootstrap";
import Loading from "../loading";
import Paths from "../../routing";
import { Link, useNavigate } from "react-router-dom";
import { MapPinIcon, TrashIcon } from "@heroicons/react/24/outline";
import TapirButton from "../TapirButton";

const DummyPickupLocationCard = () => {
  const [locations, setLocations] = useState<DummyPickupLocation[]>([]);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
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

  useEffect(() => {
    api
      .dummyAccountsWeekdaysList()
      .then(setWeekdays)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Wochentage", "danger");
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
          <Link to={Paths.dummyPickupLocationCreate}>
            <TapirButton
              variant="primary"
              icon={MapPinIcon}
              text={"Create location"}
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
                      Paths.dummyPickupLocationEdit.replace(
                        ":id",
                        location.id.toString(),
                      ),
                    )
                  }
                >
                  <td>{location.name}</td>
                  <td>
                    {weekdays
                      ? weekdays[location.deliveryDay].name
                      : location.deliveryDay}
                  </td>
                  <td>
                    <TapirButton
                      variant="danger"
                      text=""
                      icon={TrashIcon}
                      onClick={(event) => handleDelete(event, location.id)}
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

export default DummyPickupLocationCard;
