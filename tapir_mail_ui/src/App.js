import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Loading from "./components/loading";
import { AlertProvider } from "./contexts/alerts";
import { routes } from "./routing";
import env from "./env";

// add new routes in routing.ts

const InnerApp = () => {
  const location = useLocation();
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

function App() {
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
