import React, { useEffect, useState } from "react";
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
  TagIcon,
} from "@heroicons/react/24/outline";
import DispatchesWithErrorsModal from "../components/DispatchesWithErrorsModal";
import StaticSegmentsListModal from "../components/static_segments/StaticSegmentsListModal";
import { useApi } from "../hooks/useApi";
import { MissingTrigger, MissingTriggersApi } from "../api_client";
import MissingTriggersModal from "./missing_triggers/MissingTriggersModal";
import MailCategoryListModal from "../components/mail_categories/MailCategoryListModal";

function Dashboard() {
  const api = useApi(MissingTriggersApi);
  const [dispatchesWithErrorModalOpen, setDispatchesWithErrorModalOpen] =
    useState(false);
  const [staticSegmentListModalOpen, setStaticSegmentListModalOpen] =
    useState(false);
  const [missingTriggers, setMissingTriggers] = useState<MissingTrigger[]>([]);
  const [missingTriggersModalOpen, setMissingTriggersModalOpen] =
    useState(false);
  const [mailCategoryListModalOpen, setMailCategoryListModalOpen] =
    useState(false);
  const [reloadConfigurations, setReloadConfigurations] = useState(0);

  useEffect(() => {
    loadMissingTriggers();
  }, []);

  function reloadData() {
    loadMissingTriggers();
    setReloadConfigurations(reloadConfigurations + 1);
  }

  function loadMissingTriggers() {
    api
      .missingTriggersList()
      .then(setMissingTriggers)
      .catch((error) => {
        console.log(error);
        alert("Fehler beim laden der fehlende triggers");
      });
  }

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
        {missingTriggers.length > 0 && (
          <TapirButton
            variant={"danger"}
            text={"Fehlende Trigger"}
            icon={ExclamationTriangleIcon}
            onClick={() => setMissingTriggersModalOpen(true)}
            notification={missingTriggers.length}
          />
        )}
        <TapirButton
          variant="primary"
          text="Kategorien verwalten"
          icon={TagIcon}
          onClick={() => setMailCategoryListModalOpen(true)}
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
        <EmailConfigurationTable reloadConfigurations={reloadConfigurations} />
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
      <MissingTriggersModal
        open={missingTriggersModalOpen}
        onHide={() => setMissingTriggersModalOpen(false)}
        missingTriggers={missingTriggers}
        reloadData={reloadData}
      />
      <MailCategoryListModal
        open={mailCategoryListModalOpen}
        onClose={() => setMailCategoryListModalOpen(false)}
      />
    </>
  );
}

export default Dashboard;
