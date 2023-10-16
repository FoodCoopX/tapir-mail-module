import { BackspaceIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import React, { ChangeEvent, FC, useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { ElementType, FilterElement } from "./common";

interface FilterInputProps {
  availableFilters: string[];
  initialFilter: FilterElement[];
  onFilterChange: (filter: FilterElement[]) => void;
  onValidationChange: (isValid: boolean) => void;
}

const FilterInput: FC<FilterInputProps> = ({
  availableFilters: availableFilters,
  initialFilter: initialFilter,
  onFilterChange,
  onValidationChange,
}) => {
  const [openBracketCount, setOpenBracketCount] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<string>("");
  const [currentContextFilters, setCurrentContextFilters] = useState<string[]>(
    [],
  );
  const [internalFilter, setInternalFilter] =
    useState<FilterElement[]>(initialFilter);

  useEffect(() => {
    let isValid = true;

    if (internalFilter.length > 0) {
      // Begins or ends with AND, OR
      if (
        ElementType.Operator === internalFilter[0].elementType ||
        ElementType.Operator ===
          internalFilter[internalFilter.length - 1].elementType
      ) {
        isValid = false;
      }

      // Ends with NOT
      if (
        internalFilter[internalFilter.length - 1].elementType ===
        ElementType.Not
      ) {
        isValid = false;
      }

      // Number of brackets doesn't match
      const openBrackets = internalFilter.filter(
        (el: FilterElement) => el.elementType === ElementType.OpenBracket,
      ).length;
      const closeBrackets = internalFilter.filter(
        (el: FilterElement) => el.elementType === ElementType.CloseBracket,
      ).length;
      if (openBrackets !== closeBrackets) {
        isValid = false;
      }

      // Additional check for last element being AND or OR
      const lastElement = internalFilter[internalFilter.length - 1];
      if (
        lastElement.elementType === ElementType.Operator &&
        (lastElement.value === "AND" || lastElement.value === "OR")
      ) {
        isValid = false;
      }
    }

    onValidationChange(isValid);
  }, [internalFilter, onValidationChange]);

  const deleteLastElement = () => {
    if (internalFilter.length === 0) return;

    const last = internalFilter[internalFilter.length - 1];
    if (last.elementType === ElementType.OpenBracket) {
      setOpenBracketCount((prev: number) => prev - 1);
    } else if (last.elementType === ElementType.CloseBracket) {
      setOpenBracketCount((prev: number) => prev + 1);
    } else if (availableFilters.includes(last.value)) {
      setCurrentContextFilters((prev: string[]) =>
        prev.filter((f) => f !== last.value),
      );
    }

    const newFilter = internalFilter.slice(0, internalFilter.length - 1);
    setInternalFilter(newFilter);
    onFilterChange(newFilter); // Update the parent's state
  };

  const addFilter = (filter: string, elementType: ElementType) => {
    if (elementType === ElementType.Filter) {
      if (currentContextFilters.includes(filter)) {
        alert("Filter already used in this context.");
        return;
      }
      setCurrentContextFilters([...currentContextFilters, filter]);
    }

    if (elementType === ElementType.OpenBracket) {
      setOpenBracketCount((prev) => prev + 1);
      setCurrentContextFilters([]);
    }

    if (elementType === ElementType.CloseBracket) {
      setOpenBracketCount((prev) => prev - 1);
      setCurrentContextFilters([]);
    }

    const newFilter = [
      ...internalFilter,
      { value: filter, elementType: elementType },
    ];

    setInternalFilter(newFilter);
    setCurrentFilter("");
    onFilterChange(newFilter);
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setCurrentFilter(newFilter);

    if (currentContextFilters.includes(newFilter)) {
      setCurrentContextFilters(
        currentContextFilters.filter((f) => f !== currentFilter),
      );
    }
  };

  const lastElement = internalFilter[internalFilter.length - 1]?.elementType;
  const addFilterDisabled =
    currentFilter === "" ||
    lastElement === ElementType.Filter ||
    currentContextFilters.includes(currentFilter);
  const andOrDisabled =
    lastElement !== ElementType.Filter &&
    lastElement !== ElementType.CloseBracket;
  const notDisabled =
    internalFilter.length > 0 &&
    lastElement !== ElementType.OpenBracket &&
    lastElement !== ElementType.Operator;
  const openBracketDisabled =
    lastElement === ElementType.Filter ||
    lastElement === ElementType.CloseBracket;
  const closeBracketDisabled =
    (lastElement !== ElementType.Filter &&
      lastElement !== ElementType.CloseBracket) ||
    openBracketCount <= 0;

  const buttonStyles = {
    marginRight: "0.25em",
    height: "2em",
    paddingLeft: "0.5em",
    paddingRight: "0.5em",
    paddingTop: "0.1em",
    paddingBottom: "0.1em",
  };
  return (
    <div>
      <div style={{ display: "flex" }}>
        <Form.Select
          style={{
            paddingTop: "0.1em",
            paddingBottom: "0.1em",
            paddingLeft: "0.75em",
            paddingRight: "2.75em",
            fontSize: "0.875em",
          }}
          onChange={handleChange}
          value={currentFilter}
          disabled={lastElement === ElementType.Filter}
        >
          <option
            value=""
            disabled
          >
            Filter auswählen
          </option>
          {availableFilters.map((filter, idx) => (
            <option
              key={idx}
              value={filter}
            >
              {filter}
            </option>
          ))}
        </Form.Select>
        <PlusCircleIcon
          style={{
            marginLeft: "0.75em",
            cursor: addFilterDisabled ? "not-allowed" : "pointer",
          }}
          color={addFilterDisabled ? "lightgrey" : "green"}
          onClick={
            addFilterDisabled
              ? undefined
              : () => addFilter(currentFilter, ElementType.Filter)
          }
          width="2.5em"
        />
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "0.75em",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button
            style={buttonStyles}
            size="sm"
            variant={andOrDisabled ? "outline-secondary" : "primary"}
            onClick={() => addFilter("AND", ElementType.Operator)}
            disabled={andOrDisabled}
          >
            &
          </Button>
          <Button
            style={buttonStyles}
            size="sm"
            variant={andOrDisabled ? "outline-secondary" : "primary"}
            onClick={() => addFilter("OR", ElementType.Operator)}
            disabled={andOrDisabled}
          >
            OR
          </Button>
          <Button
            style={buttonStyles}
            size="sm"
            variant={notDisabled ? "outline-secondary" : "warning"}
            onClick={() => addFilter("NOT", ElementType.Not)}
            disabled={notDisabled}
          >
            NOT
          </Button>
        </div>
        <div>
          <Button
            style={buttonStyles}
            size="sm"
            variant={openBracketDisabled ? "outline-secondary" : "info"}
            onClick={() => addFilter("(", ElementType.OpenBracket)}
            disabled={openBracketDisabled}
          >
            (
          </Button>
          <Button
            style={buttonStyles}
            size="sm"
            variant={closeBracketDisabled ? "outline-secondary" : "info"}
            onClick={() => addFilter(")", ElementType.CloseBracket)}
            disabled={closeBracketDisabled}
          >
            )
          </Button>
        </div>
        <div>
          <Button
            style={buttonStyles}
            size="sm"
            variant={
              internalFilter.length === 0 ? "outline-secondary" : "danger"
            }
            onClick={deleteLastElement}
            disabled={internalFilter.length === 0}
          >
            <BackspaceIcon width="1.5em" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterInput;
export { ElementType };
export type { FilterElement };
