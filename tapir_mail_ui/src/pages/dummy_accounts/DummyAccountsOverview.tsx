import React from "react";
import DummyTapirUsersCard from "../../components/dummy_accounts/DummyTapirUsersCard";
import { Link } from "react-router-dom";
import Paths from "../../routing";
import { Button, Container } from "react-bootstrap";
import DummyContractsCard from "../../components/dummy_accounts/DummyContractsCard";

function DummyAccountsOverview() {
  return (
    <Container>
      <Link to={Paths.dashboard}>
        <Button
          size="sm"
          variant="secondary"
        >
          &lt;&lt;&nbsp;&nbsp;&nbsp;Zurück zur Übersicht
        </Button>
      </Link>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridGap: "2em",
          margin: "2em",
        }}
      >
        <DummyTapirUsersCard />
        <DummyContractsCard />
      </div>
    </Container>
  );
}

export default DummyAccountsOverview;
