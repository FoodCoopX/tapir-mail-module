import React, { useEffect, useRef } from "react";
import { loadLocale, locale, TempusDominus } from "@eonasdan/tempus-dominus";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
// @ts-ignore
import { localization, name } from "@eonasdan/tempus-dominus/dist/locales/de";
import { ChangeEvent } from "@eonasdan/tempus-dominus/types/utilities/event-types";

interface DateTimePickerProps {
  onChange: (value: Date) => void;
  initialValue: Date;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  onChange,
  initialValue,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  let dateTimePicker: TempusDominus | null = null;

  useEffect(() => {
    if (!pickerRef.current) return;
    loadLocale({ localization, name });
    locale(name);
    dateTimePicker = new TempusDominus(pickerRef.current, {
      display: { theme: "light" },
    });
    dateTimePicker.subscribe("change.td", (e: ChangeEvent) => {
      onChange(e.date ?? new Date());
    });
  }, [pickerRef]);

  useEffect(() => {
    if (!dateTimePicker) return;
    dateTimePicker.dates.setValue(
      dateTimePicker.dates.parseInput(initialValue),
    );
  }, [initialValue, dateTimePicker]);

  return (
    <div id="htmlTarget">
      <div
        ref={pickerRef}
        className="input-group"
        data-td-target-input="nearest"
        data-td-target-toggle="nearest"
        id="datetimepicker1"
      >
        <input
          type="text"
          className="form-control"
          data-td-target="#datetimepicker1"
          id="datetimepicker1Input"
        />
        <span
          className="input-group-text"
          data-td-target="#datetimepicker1"
          data-td-toggle="datetimepicker"
        >
          <i className="fas fa-calendar"></i>
        </span>
      </div>
    </div>
  );
};

export default DateTimePicker;
