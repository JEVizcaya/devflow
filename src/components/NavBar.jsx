import React from "react";
import logo from "../assets/landing-illustration.svg";
import { useDarkMode } from "../contex/DarkModeContext";
import { getAuth } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";

const NavBar = ({ onLogout }) => {
  const { darkMode, setDarkMode } = useDarkMode();
  const user = getAuth().currentUser;
  const location = useLocation();
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Menú de navegación
  const menu = [];

  return (
    <nav className="w-100 d-flex justify-content-between align-items-center py-3 px-2 px-md-5 mb-4" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center gap-2">
        <img src={logo} alt="DevFlow Logo" style={{ width: 48, height: 48 }} />
        <span className={darkMode ? "fw-bold fs-3 text-info" : "fw-bold fs-3 text-primary"}>DevFlow</span>
        <ul className="nav ms-4 d-none d-md-flex">
          {menu.map((item) => (
            <li className="nav-item" key={item.to}>
              <Link
                to={item.to}
                className={
                  "nav-link d-flex align-items-center gap-1 px-2 py-1 rounded-2 " +
                  (location.pathname === item.to
                    ? darkMode
                      ? "active text-info fw-bold bg-info bg-opacity-10"
                      : "active text-primary fw-bold bg-primary bg-opacity-10"
                    : darkMode
                    ? "text-light"
                    : "text-dark")
                }
                style={{ fontWeight: 500, transition: 'background 0.18s, color 0.18s' }}
              >
                <i className={`bi ${item.icon}`}></i> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="d-flex align-items-center gap-3">
        {user && (
          <div className="d-flex align-items-center gap-2">
            <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: darkMode ? "2px solid #0dcaf0" : "2px solid #0d6efd" }} />
            <span className={darkMode ? "text-light fw-semibold" : "text-dark fw-semibold"} style={{fontSize: 15}}>{user.displayName || user.email}</span>
          </div>
        )}
        <button className={darkMode ? "btn btn-outline-info btn-sm" : "btn btn-outline-primary btn-sm"} onClick={toggleDarkMode}>
          {darkMode ? <i className="bi bi-brightness-high"></i> : <i className="bi bi-moon"></i>} Modo {darkMode ? "Claro" : "Oscuro"}
        </button>
        {onLogout && (
          <button className={darkMode ? "btn btn-info btn-sm" : "btn btn-primary btn-sm"} onClick={onLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
