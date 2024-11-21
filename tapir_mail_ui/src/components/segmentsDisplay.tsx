import { Badge } from "react-bootstrap";
import React, { Fragment } from "react";
import "./chainedBadges.css";
import { SegmentData } from "../api_client";

interface SegmentsDisplayProps {
  segmentData: SegmentData;
  interactions?: {
    onSegmentToAddClicked: (segment: string) => void;
    onSegmentToRemoveClicked: (segment: string) => void;
    onStaticSegmentToAddClicked: (segment: string) => void;
    onStaticSegmentToRemoveClicked: (segment: string) => void;
  };
}

const SegmentsDisplay: React.FC<SegmentsDisplayProps> = ({
  segmentData,
  interactions,
}) => {
  if (
    segmentData.addSegments.length + segmentData.staticSegments.length ===
    0
  ) {
    return null;
  }
  const segmentStyle: React.CSSProperties = interactions
    ? { cursor: "pointer" }
    : {};

  return (
    <div style={{ marginBottom: "0.5em" }}>
      <h6 className="chained-badges">
        {segmentData.addSegments.map((segment, idx) => (
          <Fragment key={segment}>
            {idx > 0 && <OperatorBadge text="+" />}
            <Badge
              style={segmentStyle}
              onClick={() =>
                interactions
                  ? interactions.onSegmentToAddClicked(segment)
                  : () => {}
              }
              bg="success"
            >
              {segment}
            </Badge>
          </Fragment>
        ))}
        {segmentData.removeSegments.map((segment) => (
          <Fragment key={segment}>
            <OperatorBadge text="-" />
            <Badge
              style={segmentStyle}
              onClick={() =>
                interactions
                  ? interactions.onSegmentToRemoveClicked(segment)
                  : () => {}
              }
              bg="danger"
            >
              {segment}
            </Badge>
          </Fragment>
        ))}
        {segmentData.staticSegments.map((segment, idx) => (
          <Fragment key={segment}>
            {(segmentData.addSegments.length > 0 || idx > 0) && (
              <OperatorBadge text="+" />
            )}
            <Badge
              style={segmentStyle}
              onClick={() =>
                interactions
                  ? interactions.onStaticSegmentToAddClicked(segment)
                  : () => {}
              }
            >
              {segment}
            </Badge>
          </Fragment>
        ))}
        {segmentData.staticSegmentsSubtractive &&
          segmentData.staticSegmentsSubtractive.map((segment, idx) => (
            <Fragment key={segment}>
              {(segmentData.addSegments.length > 0 || idx > 0) && (
                <OperatorBadge text="-" />
              )}
              <Badge
                style={segmentStyle}
                onClick={() =>
                  interactions
                    ? interactions.onStaticSegmentToRemoveClicked(segment)
                    : () => {}
                }
              >
                {segment}
              </Badge>
            </Fragment>
          ))}
      </h6>
    </div>
  );
};

interface OperatorProps {
  text: string;
}
const OperatorBadge: React.FC<OperatorProps> = ({ text }) => {
  return (
    <Badge
      bg="dark"
      style={{ userSelect: "none" }}
    >
      {text}
    </Badge>
  );
};

export default SegmentsDisplay;
