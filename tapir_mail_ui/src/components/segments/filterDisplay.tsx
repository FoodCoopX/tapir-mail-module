import React, { FC } from "react";
import { Badge } from "react-bootstrap";
import { getBorderRadiusByIdx } from "./common";
import { ElementType, FilterElement } from "./filterInput";

const FilterString: FC<{ filter: FilterElement[] }> = ({ filter = [] }) => {
  const margins = {
    marginBottom: "0.25em",
    padding: "0.5em",
  };
  return (
    <div style={{ marginBottom: "0.5em" }}>
      {filter.map(({ elementType, value }, idx) => {
        switch (elementType) {
          case ElementType.Filter:
            return (
              <Badge
                style={{
                  ...margins,
                  ...getBorderRadiusByIdx(idx, filter.length),
                }}
                bg="dark"
              >
                {value}
              </Badge>
            );
          case ElementType.Operator:
            return (
              <Badge
                style={{ ...margins, borderRadius: 0 }}
                bg="primary"
              >
                {value}
              </Badge>
            );
          case ElementType.OpenBracket:
            return (
              <Badge
                style={{
                  ...margins,
                  ...getBorderRadiusByIdx(idx, filter.length, true, false),
                }}
                bg="info"
              >
                {value}
              </Badge>
            );
          case ElementType.CloseBracket:
            return (
              <Badge
                style={{
                  ...margins,
                  ...getBorderRadiusByIdx(idx, filter.length, false),
                }}
                bg="info"
              >
                {value}
              </Badge>
            );
          case ElementType.Not:
            return (
              <Badge
                style={{
                  ...margins,
                  ...getBorderRadiusByIdx(idx, filter.length, true, false),
                }}
                bg="warning"
              >
                {value}
              </Badge>
            );
        }
      })}
    </div>
  );
};

export default FilterString;
