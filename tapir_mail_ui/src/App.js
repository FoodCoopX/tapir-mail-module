import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Loading from "./components/loading";
import { AlertProvider } from "./contexts/alerts";
import env from "./env";
import { routes } from "./routing";

// add new routes in routing.ts

const InnerApp = () => {
  console.log("THEO TEST 3")
  useEffect(() => {
    const setCookie = (name, value) => {
      document.cookie = name + "=" + value + "; Path=/; SameSite=Lax;";
    };

    const handleMessage = (event) => {
      if (!env.REACT_APP_API_ROOT.startsWith(event.origin)) {
        console.log("Ignoring message from unknown origin", event.origin);
        return;
      }

      if (event.data.type === "NEW_TOKEN") {
        const newToken = event.data.token;
        setCookie("token", newToken);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const location = useLocation();
  console.log("THEO TEST 4")
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Suspense
        fallback={
          <div style={{ width: "100%", marginTop: "5em" }}>
            <Loading />
          </div>
        }
      >
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={<route.element />}
            />
          ))}
        </Routes>
      </Suspense>
    </motion.div>
  );
};

console.log("THEO TEST OUTSIDE APP")
function App() {
  console.log("THEO TEST 2")
  return (
    <div
      className="App"
      data-testid="App"
    >
      <AlertProvider>
        <AnimatePresence mode="wait">
          <Router basename={env.REACT_APP_BASENAME}>
            <InnerApp />
          </Router>
        </AnimatePresence>
      </AlertProvider>
    </div>
  );
}

export default App;
