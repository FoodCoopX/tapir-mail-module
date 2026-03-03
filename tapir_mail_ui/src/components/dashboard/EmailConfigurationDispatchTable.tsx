import React, { useEffect, useState } from "react";
import { Card, Table } from "react-bootstrap";
import {
  EmailConfigurationDispatch,
  EmailConfigurationDispatchApi,
  EmailConfigurationVersion,
  SegmentApi,
} from "../../api_client";
import { useAlert } from "../../contexts/alerts";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/formatDate";
import Loading from "../loading";
import SegmentsDisplay from "../segmentsDisplay";
import FilterDisplay from "../segments/filterDisplay";
import { guessElementType } from "../segments/common";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import TapirPagination from "../TapirPagination";
import SelectVersionModal from "./SelectVersionModal";
import DispatchDetailsModal from "../DispatchDetailsModal";
import { EmailConfigurationDispatchStats } from "./EmailConfigurationDispatchStats";
import TapirTooltip from "../TapirTooltip";
import { buildSegmentDataFromVersion } from "../../utils/buildSegmentDataFromVersion";

interface EmailConfigurationVersionStatusTableProps {
  cardTitle: string;
  content: "last-sent" | "next-sends";
}

const EmailConfigurationDispatchTable: React.FC<
  EmailConfigurationVersionStatusTableProps
> = ({ cardTitle, content }) => {
  const api = useApi(EmailConfigurationDispatchApi);
  const segmentApi = useApi(SegmentApi);
  const showAlert = useAlert();

  const [emailConfigurationDispatches, setEmailConfigurationDispatches] =
    useState<EmailConfigurationDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [dispatchCount, setDispatchCount] = useState(0);
  const [
    selectedEmailConfigurationVersion,
    setSelectedEmailConfigurationVersion,
  ] = useState<EmailConfigurationVersion>();
  const [
    emailConfigurationDispatchForStats,
    setEmailConfigurationDispatchForStats,
  ] = useState<EmailConfigurationDispatch>();
  const [availableDynamicSegments, setAvailableDynamicSegments] = useState<{
    [id: string]: string;
  }>({});
  const [availableStaticSegments, setAvailableStaticSegments] = useState<{
    [id: string]: string;
  }>({});
  const [availableMailCategories, setAvailableMailCategories] = useState<{
    [id: string]: string;
  }>({});

  useEffect(() => {
    segmentApi
      .segmentAvailableSegmentsRetrieve()
      .then((response) => {
        setAvailableDynamicSegments(response.dynamicSegments);
        setAvailableStaticSegments(response.staticSegments);
        setAvailableMailCategories(response.mailCategories);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Segment-Daten", "danger");
      });
  }, []);

  const fetchEmailConfigurationDispatch = () => {
    let call;
    switch (content) {
      case "last-sent":
        call = api.emailConfigurationDispatchLastSentList.bind(api);
        break;
      case "next-sends":
        call = api.emailConfigurationDispatchNextSendsList.bind(api);
        break;
    }

    call({
      limit: DEFAULT_PAGE_SIZE,
      offset: currentPage * DEFAULT_PAGE_SIZE,
    })
      .then((paginatedData) => {
        setEmailConfigurationDispatches(paginatedData.results ?? []);
        setDispatchCount(paginatedData.count ?? 0);
      })
      .catch((err) => {
        console.error(err);
        showAlert("Fehler beim Laden der Emails", "danger");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmailConfigurationDispatch();

    const interval = setInterval(() => {
      fetchEmailConfigurationDispatch();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  function hasRecipientOverride(dispatch: EmailConfigurationDispatch): boolean {
    if (!dispatch.overrideRecipients) {
      return false;
    }

    if (Array.isArray(dispatch.overrideRecipients)) {
      return dispatch.overrideRecipients.length > 0;
    }

    return true;
  }

  return (
    <>
      <Card>
        <Card.Header
          as="h5"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{cardTitle}</span>
        </Card.Header>
        <Card.Body style={{ padding: 0, border: "none" }}>
          {loading ? (
            <Loading />
          ) : (
            <Table
              striped
              hover
              style={{ margin: "0" }}
              responsive
            >
              <thead>
                <tr>
                  <th>Name</th>
                  {content === "last-sent" && (
                    <>
                      <th>Gesendet am</th>
                      <th>Empfänger</th>
                      <th>Öffnungsrate</th>
                    </>
                  )}
                  {content === "next-sends" && (
                    <>
                      <th>Versandzeitpunkt</th>
                      <th>Empfänger</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {emailConfigurationDispatches.map(
                  (emailConfigurationDispatch) => (
                    <tr
                      style={{ cursor: "pointer" }}
                      key={content + "-" + emailConfigurationDispatch.id}
                      onClick={() =>
                        setSelectedEmailConfigurationVersion(
                          emailConfigurationDispatch.emailConfigurationVersion,
                        )
                      }
                    >
                      <td>
                        {
                          emailConfigurationDispatch.emailConfigurationVersion
                            .emailConfiguration.name
                        }
                      </td>
                      <td>
                        {formatDate(emailConfigurationDispatch.scheduledTime)}
                      </td>
                      <td>
                        {hasRecipientOverride(emailConfigurationDispatch) ? (
                          <span className={"text-break"}>
                            {
                              emailConfigurationDispatch.overrideRecipientsDisplay
                            }
                          </span>
                        ) : (
                          <>
                            <SegmentsDisplay
                              segmentData={buildSegmentDataFromVersion(
                                emailConfigurationDispatch.emailConfigurationVersion,
                              )}
                              availableDynamicSegments={
                                availableDynamicSegments
                              }
                              availableStaticSegments={availableStaticSegments}
                              availableMailCategories={availableMailCategories}
                            />
                            <FilterDisplay
                              filter={(
                                emailConfigurationDispatch
                                  .emailConfigurationVersion.filterList ?? []
                              ).map((filter) => {
                                return {
                                  value: filter,
                                  elementType: guessElementType(filter),
                                };
                              })}
                            />
                          </>
                        )}
                      </td>
                      {content === "last-sent" && (
                        <td
                          style={{ padding: "0.1em", margin: "0" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailConfigurationDispatchForStats(
                              emailConfigurationDispatch,
                            );
                          }}
                        >
                          <TapirTooltip
                            text="Details anzeigen"
                            id={content + "-" + emailConfigurationDispatch.id}
                          >
                            <div style={{ width: "100%", height: "100%" }}>
                              <EmailConfigurationDispatchStats
                                emailConfigurationDispatch={
                                  emailConfigurationDispatch
                                }
                              />
                            </div>
                          </TapirTooltip>
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {dispatchCount > DEFAULT_PAGE_SIZE && (
          <Card.Footer className="d-flex justify-content-center align-items-center">
            <TapirPagination
              pageSize={DEFAULT_PAGE_SIZE}
              itemCount={dispatchCount}
              currentPage={currentPage}
              goToPage={setCurrentPage}
            />
          </Card.Footer>
        )}
      </Card>
      <SelectVersionModal
        open={!!selectedEmailConfigurationVersion}
        emailConfiguration={
          selectedEmailConfigurationVersion?.emailConfiguration!
        }
        onClose={() => setSelectedEmailConfigurationVersion(undefined)}
        onDataChanged={fetchEmailConfigurationDispatch}
        selectedVersionOnOpen={selectedEmailConfigurationVersion?.id}
      />
      {emailConfigurationDispatchForStats && (
        <DispatchDetailsModal
          configDispatch={emailConfigurationDispatchForStats}
          open={!!emailConfigurationDispatchForStats}
          onClose={() => setEmailConfigurationDispatchForStats(undefined)}
        />
      )}
    </>
  );
};

export default EmailConfigurationDispatchTable;
