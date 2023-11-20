import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import TapirMailFormGroup from "../TapirMailFormGroup";
import {
  DeliveryDayEnum,
  DummyAccountsApi,
  DummyPickupLocation,
  Weekday,
} from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import TapirDropdown from "../tapirDropdown";

interface DummyPickupLocationFormProps {
  location: DummyPickupLocation;
  onSave: () => void;
}

const DummyPickupLocationForm: React.FC<DummyPickupLocationFormProps> = ({
  location,
  onSave,
}) => {
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [deliveryDay, setDeliveryDay] = useState<DeliveryDayEnum>(
    location.deliveryDay,
  );

  const showAlert = useAlert();
  const api = useApi(DummyAccountsApi);

  useEffect(() => {
    api
      .dummyAccountsWeekdaysList()
      .then(setWeekdays)
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Locations", "danger");
      });
  }, []);

  interface FormGroupProps {
    label: string;
    type: string;
    field: keyof Omit<DummyPickupLocation, "id">;
  }

  const formGroups: FormGroupProps[] = [
    { label: "Name", type: "text", field: "name" },
  ];
  return (
    <Form style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {formGroups.map((formGroup) => {
        return (
          <TapirMailFormGroup
            label={formGroup.label}
            type={formGroup.type}
            value={location[formGroup.field]}
            onChange={(value: any) => {
              let foo: {
                [key: string]: any;
              } = {};
              foo[formGroup.field] = value;
              Object.assign(location, foo);
            }}
          />
        );
      })}
      <TapirDropdown
        choices={weekdays}
        onChoiceSelected={(weekday) => {
          if (!weekday) return;
          setDeliveryDay(weekday.id);
          location.deliveryDay = weekday!.id;
        }}
        selectedChoice={weekdays[deliveryDay]}
      />

      <Button
        variant="primary"
        onClick={onSave}
      >
        Save
      </Button>
    </Form>
  );
};

export default DummyPickupLocationForm;
