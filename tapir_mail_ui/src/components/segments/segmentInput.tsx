import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import React, { FC, useEffect, useState } from "react";
import { Accordion, Badge, Form } from "react-bootstrap";
import { SegmentApi, SegmentData } from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import AccordionToggleCompact from "../accordionToggleCompact";
import { guessElementType } from "./common";
import FilterDisplay from "./filterDisplay";
import FilterInput, { FilterElement } from "./filterInput";
import SegmentsDisplay from "../segmentsDisplay";

type SegmentInputProps = {
  initialData?: SegmentData;
  onChange: (data: SegmentData) => void;
};

const SegmentInput: FC<SegmentInputProps> = ({ initialData, onChange }) => {
  const segmentApi = useApi(SegmentApi);
  const showAlert = useAlert();

  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [availableStaticSegments, setAvailableStaticSegments] = useState<
    string[]
  >([]);
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);

  const [selectedSegment, setSelectedSegment] = useState<string>("");

  const [segmentsToAdd, setSegmentsToAdd] = useState<string[]>([]);
  const [staticSegmentsToAdd, setStaticSegmentsToAdd] = useState<string[]>([]);
  const [segmentsToRemove, setSegmentsToRemove] = useState<string[]>([]);
  const [complexFilter, setComplexFilter] = useState<FilterElement[]>([]);

  const [resultCount, setResultCount] = useState<number>(0);
  const [resultRecipients, setResultRecipients] = useState<any[]>([]);

  const [isFilterValid, setIsFilterValid] = useState<boolean>(true);

  useEffect(() => {
    onChange({
      addSegments: segmentsToAdd,
      staticSegments: staticSegmentsToAdd,
      removeSegments: segmentsToRemove,
      filterList: isFilterValid ? complexFilter.map((c) => c.value) : [],
    });
  }, [
    segmentsToAdd,
    staticSegmentsToAdd,
    segmentsToRemove,
    complexFilter,
    isFilterValid,
  ]);

  useEffect(() => {
    segmentApi
      .segmentAvailableSegmentsRetrieve()
      .then(({ segments, staticSegments }) => {
        setAvailableSegments(segments!!);
        setAvailableStaticSegments(staticSegments!!);

        if (initialData) {
          initialData.addSegments && setSegmentsToAdd(initialData.addSegments);
          initialData.staticSegments &&
            setStaticSegmentsToAdd(initialData.staticSegments);
          initialData.removeSegments &&
            setSegmentsToRemove(initialData.removeSegments);
          initialData.filterList &&
            setComplexFilter(
              initialData.filterList.map((f: string) => ({
                value: f,
                elementType: guessElementType(f),
              })),
            );
        }
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim laden der Segmente!", "danger");
      });

    segmentApi
      .segmentAvailableFiltersRetrieve()
      .then(({ filters }) => setAvailableFilters(filters || []))
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Filter!", "danger");
      });
  }, []);

  useEffect(() => {
    if (
      !isFilterValid ||
      segmentsToAdd.length + staticSegmentsToAdd.length < 1
    ) {
      setResultCount(0);
      setResultRecipients([]);
      return;
    }

    const filters = complexFilter.map((filterElement) => filterElement.value);
    segmentApi
      .segmentCombineCreate({
        segmentDataRequest: {
          addSegments: segmentsToAdd,
          staticSegments: staticSegmentsToAdd,
          removeSegments: segmentsToRemove,
          filterList: filters,
        },
      })
      .then(({ count, recipients }) => {
        setResultCount(count!!);
        setResultRecipients(recipients!!.map((recipient) => recipient.name));
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Empfänger!", "danger");
      });
  }, [
    segmentsToAdd,
    staticSegmentsToAdd,
    segmentsToRemove,
    complexFilter,
    isFilterValid,
  ]);

  const handleAddSegment = () => {
    if (selectedSegment === "") return;
    if (availableStaticSegments.includes(selectedSegment)) {
      setStaticSegmentsToAdd((prev) => [...prev, selectedSegment]);
    } else {
      setSegmentsToAdd((prev) => [...prev, selectedSegment]);
    }
    setSelectedSegment("");
  };

  const handleRemoveSegment = () => {
    if (selectedSegment === "") return;

    setSegmentsToRemove((prev) => [...prev, selectedSegment]);
    setSelectedSegment("");
  };

  const segmentOptions = availableSegments.filter(
    (s) => !segmentsToAdd.includes(s) && !segmentsToRemove.includes(s),
  );

  const staticSegmentOptions = availableStaticSegments.filter(
    (s) => !segmentsToAdd.includes(s),
  );

  const handleFilterChange = (filter: FilterElement[], isValid: boolean) => {
    setComplexFilter(filter);
    setIsFilterValid(isValid);
  };

  const plusSegmentButtonDisabled = !selectedSegment || selectedSegment === "";
  const minusSegmentButtonDisabled =
    plusSegmentButtonDisabled ||
    segmentsToAdd.length === 0 ||
    availableStaticSegments.includes(selectedSegment);

  function onSegmentToAddClicked(segment: string) {
    const newSegmentsToAdd = segmentsToAdd.filter((s) => s !== segment);
    setSegmentsToAdd(newSegmentsToAdd);
    if (newSegmentsToAdd.length === 0) {
      setSegmentsToRemove([]);
      setComplexFilter([]);
    }
  }

  function onSegmentToRemoveClicked(segment: string) {
    setSegmentsToRemove(segmentsToRemove.filter((s) => s !== segment));
  }

  function onStaticSegmentToAddClicked(segment: string) {
    setStaticSegmentsToAdd(staticSegmentsToAdd.filter((s) => s !== segment));
  }

  return (
    <div>
      <Form.Label>Segmente</Form.Label>
      <SegmentsDisplay
        segmentData={{
          addSegments: segmentsToAdd,
          removeSegments: segmentsToRemove,
          staticSegments: staticSegmentsToAdd,
          filterList: [],
        }}
        interactions={{
          onSegmentToAddClicked: onSegmentToAddClicked,
          onStaticSegmentToAddClicked: onStaticSegmentToAddClicked,
          onSegmentToRemoveClicked: onSegmentToRemoveClicked,
        }}
      />
      <div style={{ display: "flex" }}>
        <Form.Select
          onChange={(e) => setSelectedSegment(e.currentTarget.value)}
          value={selectedSegment || ""}
        >
          <option
            value=""
            disabled
          >
            Segment auswählen
          </option>
          {segmentOptions.map((segment) => (
            <option key={segment}>{segment}</option>
          ))}
          {staticSegmentOptions.map((segment) => (
            <option
              style={{ color: "blue" }}
              key={segment}
            >
              {segment}
            </option>
          ))}
        </Form.Select>
        <PlusCircleIcon
          style={{
            marginLeft: "0.5em",
            cursor: plusSegmentButtonDisabled ? "not-allowed" : "pointer",
          }}
          color={plusSegmentButtonDisabled ? "lightgrey" : "green"}
          onClick={plusSegmentButtonDisabled ? undefined : handleAddSegment}
          width="3em"
        />
        <MinusCircleIcon
          style={{
            cursor: minusSegmentButtonDisabled ? "not-allowed" : "pointer",
          }}
          color={minusSegmentButtonDisabled ? "lightgrey" : "red"}
          onClick={minusSegmentButtonDisabled ? undefined : handleRemoveSegment}
          width="3em"
        />
      </div>

      {(segmentsToAdd.length > 0 || staticSegmentsToAdd.length > 0) && (
        <>
          <Accordion style={{ marginTop: "0.5em" }}>
            <Accordion.Item eventKey="0">
              <AccordionToggleCompact eventKey="0">
                Erweiterte Filter&nbsp;&nbsp;
                {complexFilter.length > 0 ? (
                  isFilterValid ? (
                    <CheckBadgeIcon
                      style={{
                        float: "right",
                        marginRight: "1em",
                        color: "green",
                      }}
                      width={20}
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      style={{
                        float: "right",
                        marginRight: "1em",
                        color: "red",
                      }}
                      width={20}
                    />
                  )
                ) : (
                  <span
                    style={{ width: 20, float: "right", marginRight: "1em" }}
                  >
                    &nbsp;
                  </span>
                )}
              </AccordionToggleCompact>
              <Accordion.Body style={{ padding: "1em", paddingTop: 0 }}>
                {complexFilter.length > 0 && (
                  <FilterDisplay filter={complexFilter} />
                )}
                <FilterInput
                  availableFilters={availableFilters}
                  initialFilter={complexFilter}
                  onFilterChange={handleFilterChange}
                />
                {isFilterValid || (
                  <Badge
                    style={{ marginTop: "1em" }}
                    bg={"danger"}
                  >
                    Ungültiger Filter
                  </Badge>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {isFilterValid && (
            <Accordion style={{ marginTop: "1em" }}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <span style={{ width: "100%" }}>
                    Empfänger&nbsp;
                    <Badge
                      style={{ float: "right", marginRight: "1em" }}
                      bg="success"
                    >
                      {resultCount}
                    </Badge>
                  </span>
                </Accordion.Header>
                <Accordion.Body
                  className="p-0"
                  style={{ textAlign: "left" }}
                >
                  {resultRecipients.map((recipient, idx) => (
                    <span
                      key={recipient}
                      className={`d-block ${
                        idx % 2 === 0 ? "bg-light" : ""
                      } py-1 px-2`}
                    >
                      <small>
                        <strong>{idx + 1}: </strong>
                        {recipient}
                      </small>
                    </span>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </>
      )}
    </div>
  );
};

export default SegmentInput;
