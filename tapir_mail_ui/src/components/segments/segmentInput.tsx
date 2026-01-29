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

  const [availableDynamicSegments, setAvailableDynamicSegments] = useState<{
    [id: string]: string;
  }>({});
  const [availableStaticSegments, setAvailableStaticSegments] = useState<{
    [id: string]: string;
  }>({});
  const [availableMailCategories, setAvailableMailCategories] = useState<{
    [id: string]: string;
  }>({});
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);

  const [selectedSegment, setSelectedSegment] = useState<string>("");

  const [segmentsToAdd, setSegmentsToAdd] = useState<string[]>([]);
  const [staticSegmentsToAdd, setStaticSegmentsToAdd] = useState<string[]>([]);
  const [staticSegmentsToRemove, setStaticSegmentsToRemove] = useState<
    string[]
  >([]);
  const [segmentsToRemove, setSegmentsToRemove] = useState<string[]>([]);
  const [complexFilter, setComplexFilter] = useState<FilterElement[]>([]);
  const [selectedMailCategoryIds, setSelectedMailCategoryIds] = useState<
    string[]
  >([]);

  const [resultCount, setResultCount] = useState<number>(0);
  const [resultRecipients, setResultRecipients] = useState<any[]>([]);

  const [isFilterValid, setIsFilterValid] = useState<boolean>(true);

  useEffect(() => {
    onChange({
      dynamicSegmentNamesAdditive: segmentsToAdd,
      dynamicSegmentNamesSubtractive: segmentsToRemove,
      staticSegmentIdsAdditive: staticSegmentsToAdd,
      staticSegmentIdsSubtractive: staticSegmentsToRemove,
      filterList: isFilterValid ? complexFilter.map((c) => c.value) : [],
      mailCategoryIdsAdditive: selectedMailCategoryIds,
    });
  }, [
    segmentsToAdd,
    staticSegmentsToAdd,
    segmentsToRemove,
    staticSegmentsToRemove,
    complexFilter,
    isFilterValid,
    selectedMailCategoryIds,
  ]);

  useEffect(() => {
    segmentApi
      .segmentAvailableSegmentsRetrieve()
      .then((response) => {
        setAvailableDynamicSegments(response.dynamicSegments);
        setAvailableStaticSegments(response.staticSegments);
        setAvailableMailCategories(response.mailCategories);

        if (initialData) {
          setSegmentsToAdd(initialData.dynamicSegmentNamesAdditive);
          setSegmentsToRemove(initialData.dynamicSegmentNamesSubtractive);
          setStaticSegmentsToAdd(initialData.staticSegmentIdsAdditive);
          setStaticSegmentsToRemove(
            initialData.staticSegmentIdsSubtractive ?? [],
          );
          setSelectedMailCategoryIds(initialData.mailCategoryIdsAdditive ?? []);

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
      segmentsToAdd.length +
        staticSegmentsToAdd.length +
        selectedMailCategoryIds.length <
        1
    ) {
      setResultCount(0);
      setResultRecipients([]);
      return;
    }

    const filters = complexFilter.map((filterElement) => filterElement.value);
    segmentApi
      .segmentCombineCreate({
        segmentDataRequest: {
          dynamicSegmentNamesAdditive: segmentsToAdd,
          dynamicSegmentNamesSubtractive: segmentsToRemove,
          staticSegmentIdsAdditive: staticSegmentsToAdd,
          staticSegmentIdsSubtractive: staticSegmentsToRemove,
          filterList: filters,
          mailCategoryIdsAdditive: selectedMailCategoryIds,
        },
      })
      .then(({ count, recipients }) => {
        setResultCount(count!);
        setResultRecipients(recipients!.map((recipient) => recipient.name));
      })
      .catch((error) => {
        console.error(error);
        showAlert("Fehler beim Laden der Empfänger!", "danger");
      });
  }, [
    segmentsToAdd,
    staticSegmentsToAdd,
    staticSegmentsToRemove,
    segmentsToRemove,
    complexFilter,
    isFilterValid,
    selectedMailCategoryIds,
  ]);

  const handleAddSegment = () => {
    if (selectedSegment === "") return;
    if (Object.keys(availableStaticSegments).includes(selectedSegment)) {
      setStaticSegmentsToAdd((prev) => [...prev, selectedSegment]);
    } else if (Object.keys(availableMailCategories).includes(selectedSegment)) {
      setSelectedMailCategoryIds((previous) => [...previous, selectedSegment]);
    } else {
      setSegmentsToAdd((prev) => [...prev, selectedSegment]);
    }
    setSelectedSegment("");
  };

  const handleRemoveSegment = () => {
    if (selectedSegment === "") return;

    if (Object.keys(availableStaticSegments).includes(selectedSegment)) {
      setStaticSegmentsToRemove((prev) => [...prev, selectedSegment]);
    } else {
      setSegmentsToRemove((prev) => [...prev, selectedSegment]);
    }

    setSelectedSegment("");
  };

  function getDynamicSegmentOptions() {
    const segmentOptions = Object.entries(availableDynamicSegments).filter(
      ([segmentId, _]) =>
        !segmentsToAdd.includes(segmentId) &&
        !segmentsToRemove.includes(segmentId),
    );

    return segmentOptions.map(([segmentId, segmentName]) => (
      <option
        key={segmentId}
        value={segmentId}
      >
        {segmentName}
      </option>
    ));
  }

  function getStaticSegmentOptions() {
    const staticSegmentOptions = Object.entries(availableStaticSegments).filter(
      ([segmentId, _]) =>
        !staticSegmentsToAdd.includes(segmentId) &&
        !staticSegmentsToRemove.includes(segmentId),
    );

    return staticSegmentOptions.map(([segmentId, segmentName]) => (
      <option
        key={segmentId}
        value={segmentId}
      >
        {segmentName}
      </option>
    ));
  }

  function getMailCategoryOptions() {
    const options = Object.entries(availableMailCategories).filter(
      ([categoryId, _]) => !selectedMailCategoryIds.includes(categoryId),
    );

    return options.map(([categoryId, categoryName]) => (
      <option
        key={categoryId}
        value={categoryId}
      >
        {categoryName}
      </option>
    ));
  }

  const handleFilterChange = (filter: FilterElement[], isValid: boolean) => {
    setComplexFilter(filter);
    setIsFilterValid(isValid);
  };

  const plusSegmentButtonDisabled = !selectedSegment || selectedSegment === "";
  const minusSegmentButtonDisabled =
    plusSegmentButtonDisabled ||
    segmentsToAdd.length === 0 ||
    Object.keys(availableMailCategories).includes(selectedSegment);

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

  function onStaticSegmentToRemoveClicked(segment: string) {
    setStaticSegmentsToRemove(staticSegmentsToAdd.filter((s) => s !== segment));
  }

  function onMailCategoryIdClicked(mailCategoryId: string) {
    setSelectedMailCategoryIds(
      selectedMailCategoryIds.filter((id) => id !== mailCategoryId),
    );
  }

  return (
    <div>
      <Form.Label>Segmente</Form.Label>
      <SegmentsDisplay
        segmentData={{
          dynamicSegmentNamesAdditive: segmentsToAdd,
          dynamicSegmentNamesSubtractive: segmentsToRemove,
          staticSegmentIdsAdditive: staticSegmentsToAdd,
          staticSegmentIdsSubtractive: staticSegmentsToRemove,
          mailCategoryIdsAdditive: selectedMailCategoryIds,
          filterList: [],
        }}
        interactions={{
          onSegmentToAddClicked: onSegmentToAddClicked,
          onSegmentToRemoveClicked: onSegmentToRemoveClicked,
          onStaticSegmentToAddClicked: onStaticSegmentToAddClicked,
          onStaticSegmentToRemoveClicked: onStaticSegmentToRemoveClicked,
          onMailCategoryIdClicked: onMailCategoryIdClicked,
        }}
        availableDynamicSegments={availableDynamicSegments}
        availableStaticSegments={availableStaticSegments}
        availableMailCategories={availableMailCategories}
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
          {getDynamicSegmentOptions()}
          {getStaticSegmentOptions()}
          {getMailCategoryOptions()}
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

      {(segmentsToAdd.length > 0 ||
        staticSegmentsToAdd.length > 0 ||
        selectedMailCategoryIds.length > 0) && (
        <>
          <Accordion style={{ marginTop: "0.5em" }}>
            <Accordion.Item eventKey="0">
              <AccordionToggleCompact eventKey="0">
                Erweiterte Filter&nbsp;&nbsp;
                {complexFilter.length > 0 &&
                  (isFilterValid ? (
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
                  ))}
                {complexFilter.length === 0 && (
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
