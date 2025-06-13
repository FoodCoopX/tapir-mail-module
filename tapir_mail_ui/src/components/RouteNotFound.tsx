import React, { useEffect } from "react";
import { routes } from "../routing";

interface RouteNotFoundProps {

}

const RouteNotFound: React.FC<RouteNotFoundProps> = ({}) => {

  return (
    <>
      <div>ROUTE NOT FOUND</div>
      <ul>{routes.map((route) => <li>{route.path}</li>)}</ul>
    </>

  );
};

export default RouteNotFound;
