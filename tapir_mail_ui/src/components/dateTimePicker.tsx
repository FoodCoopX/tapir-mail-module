import React, { useEffect, useRef } from "react";
import { TempusDominus } from "@eonasdan/tempus-dominus";

interface DateTimePickerProps {
  onChange: (value: Date) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ onChange }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  let dateTimePicker: TempusDominus | null = null;

  useEffect(() => {
    if (pickerRef.current) {
      dateTimePicker = new TempusDominus(pickerRef.current);
    }
  });

  const handleInputChange = () => {
    if (dateTimePicker) onChange(dateTimePicker?.viewDate);
  };

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
          onChange={handleInputChange}
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
