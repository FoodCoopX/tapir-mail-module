import React, { FC } from "react";
import { Badge } from "react-bootstrap";
import "../chainedBadges.css";
import { FILTER_ELEMENT_COLORS, FilterElement } from "./common";

const FilterDisplay: FC<{ filter: FilterElement[] }> = ({ filter = [] }) => {
  return (
    <div
      style={{ marginBottom: "0.5em" }}
      className="chained-badges"
    >
      {filter.map(({ elementType, value }, idx) => (
        <Badge
          key={elementType + "-" + value}
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
