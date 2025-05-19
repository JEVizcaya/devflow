import { useDarkMode } from "../contex/DarkModeContext";
import { useEffect } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  const { darkMode } = useDarkMode();
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`toast align-items-center show position-fixed bottom-0 end-0 m-4 border-0 ${
        darkMode ? "bg-dark text-light" : "bg-white text-dark"
      }`}
      style={{ zIndex: 9999, minWidth: 220, boxShadow: "0 2px 16px #0004" }}
      role="alert"
    >
      <div className="d-flex">
        <div className="toast-body">
          {type === "success" ? (
            <i className="bi bi-check-circle-fill text-success me-2"></i>
          ) : (
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          )}
          {message}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white ms-2 m-auto"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </div>
    </div>
  );
};

export default Toast;
