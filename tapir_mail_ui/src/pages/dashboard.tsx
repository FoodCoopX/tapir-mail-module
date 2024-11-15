import React, { useState } from "react";
import { Link } from "react-router-dom";
import EmailConfigurationDispatchTable from "../components/dashboard/EmailConfigurationDispatchTable";
import Paths from "../routing";
import TemplatesCard from "../components/dashboard/TemplatesCard";
import EmailConfigurationTable from "../components/dashboard/EmailConfigurationsTable";
import TapirButton from "../components/TapirButton";
import {
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import DispatchesWithErrorsModal from "../components/DispatchesWithErrorsModal";
import StaticSegmentsListModal from "../components/static_segments/StaticSegmentsListModal";

function Dashboard() {
  const [dispatchesWithErrorModalOpen, setDispatchesWithErrorModalOpen] =
    useState(false);
  const [staticSegmentListModalOpen, setStaticSegmentListModalOpen] =
    useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <Link to={Paths.mediaLibrary}>
          <TapirButton
            variant="primary"
            text="Medien verwalten"
            icon={PhotoIcon}
          />
        </Link>
        <TapirButton
          variant="primary"
          text="Statische Segmente verwalten"
          icon={AdjustmentsHorizontalIcon}
          onClick={() => setStaticSegmentListModalOpen(true)}
        />
        <TapirButton
          variant="primary"
          text="Email-Adressen mit Fehler"
          icon={ExclamationTriangleIcon}
          onClick={() => setDispatchesWithErrorModalOpen(true)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridGap: "2em",
          margin: "2em",
        }}
      >
        <EmailConfigurationTable />
        <TemplatesCard />
        <EmailConfigurationDispatchTable
          cardTitle="Zuletzt gesendete E-Mails"
          content="last-sent"
        />
        <EmailConfigurationDispatchTable
          cardTitle="Warten auf Versand"
          content="next-sends"
        />
      </div>
      <DispatchesWithErrorsModal
        open={dispatchesWithErrorModalOpen}
        onClose={() => setDispatchesWithErrorModalOpen(false)}
      />
      <StaticSegmentsListModal
        open={staticSegmentListModalOpen}
        onClose={() => setStaticSegmentListModalOpen(false)}
      />
    </>
  );
}

export default Dashboard;
