import React, { FC } from "react";
import { Badge } from "react-bootstrap";
import { FILTER_ELEMENT_COLORS, FilterElement } from "./common";
import "../chainedBadges.css";

const FilterDisplay: FC<{ filter: FilterElement[] }> = ({ filter = [] }) => {
  return (
    <div
      style={{ marginBottom: "0.5em" }}
      className="chained-badges"
    >
      {filter.map(({ elementType, value }, idx) => (
        <Badge
          style={{
            marginBottom: "0.25em",
            padding: "0.5em",
          }}
          bg={FILTER_ELEMENT_COLORS[elementType]}
        >
          {value}
        </Badge>
      ))}
    </div>
  );
};

export default FilterDisplay;
