import React from "react";
import { Link } from "react-router-dom";
import EmailConfigurationDispatchTable from "../components/dashboard/EmailConfigurationDispatchTable";
import Paths from "../routing";
import TemplatesCard from "../components/dashboard/TemplatesCard";
import EmailConfigurationTable from "../components/dashboard/EmailConfigurationsTable";
import TapirButton from "../components/TapirButton";
import { PhotoIcon, UserIcon } from "@heroicons/react/24/outline";

function Dashboard() {
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
    </>
  );
}

export default Dashboard;
