import React from "react";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import { Dropdown, DropdownButton } from "react-bootstrap";

interface Choice {
  id: number | string;
  name: string;
}

interface DropdownProps<T extends Choice> {
  choices: T[];
  onChoiceSelected: (choice_id: T | null) => void;
  selectedChoice?: T;
}

const TapirDropdown = <T extends Choice>({
  choices,
  onChoiceSelected,
  selectedChoice,
}: DropdownProps<T>) => {
  return (
    <DropdownButton
      title={selectedChoice ? selectedChoice.name : "Select an option"}
      onSelect={(selected_index) => {
        onChoiceSelected(
          selected_index ? choices[parseInt(selected_index)] : null,
        );
      }}
    >
      {choices.map((choice, index) => (
        <Dropdown.Item
          key={index}
          eventKey={index}
        >
          {choice.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export default TapirDropdown;
