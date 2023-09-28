import React, {
  ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { Alert } from "react-bootstrap";

type ShowAlertFunction = (
  msg: string,
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark",
  duration?: number,
) => void;

const AlertContext = createContext<ShowAlertFunction>(() => {});

export const useAlert = () => {
  return useContext(AlertContext);
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [ts, setTs] = useState(Date.now());
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert: ShowAlertFunction = (
    msg,
    variant = "primary",
    duration = 2000,
  ) => {
    setTs(Date.now());
    setMessage(msg);
    setVariant(variant);
    setShow(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, duration);
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      <Alert
        key={ts}
        style={{
          position: "fixed",
          top: "1em",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "pre",
          zIndex: 999999,
        }}
        hidden={!show}
        variant={variant}
        transition
        dismissible
      >
        {message}
      </Alert>
    </AlertContext.Provider>
  );
};
