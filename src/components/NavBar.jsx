import React from "react";
import logo from "../assets/landing-illustration.svg";
import { useDarkMode } from "../contex/DarkModeContext";
import { getAuth } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";

const NavBar = ({ onLogout, showDarkSwitchOnly }) => {
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
      </div>
      <div className="d-flex align-items-center gap-4">
        {showDarkSwitchOnly ? (
          <div className="d-flex align-items-center gap-2 ms-2" style={{height: 24, minWidth: 0}}>
            <span
              className="devflow-switch-label"
              style={{
                fontSize: 15,
                whiteSpace: 'nowrap',
                marginRight: 4,
                color: darkMode ? '#fff' : '#212529',
                transition: 'color 0.2s'
              }}
            >
              Modo oscuro
            </span>
            <label className="devflow-switch" style={{marginBottom: 0}}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="devflow-slider"></span>
            </label>
          </div>
        ) : user && (
          <div className="d-flex align-items-center gap-3">
            <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: darkMode ? "2px solid #0dcaf0" : "2px solid #0d6efd" }} />
            <span className={darkMode ? "text-light fw-semibold" : "text-dark fw-semibold"} style={{fontSize: 15}}>
              {user.reloadUserInfo && user.reloadUserInfo.screenName ? user.reloadUserInfo.screenName : user.email.split("@")[0]}
            </span>
            <div className="d-flex align-items-center gap-2 ms-2" style={{height: 24, minWidth: 0}}>
              <span
                className="devflow-switch-label"
                style={{
                  fontSize: 15,
                  whiteSpace: 'nowrap',
                  marginRight: 4,
                  color: darkMode ? '#fff' : '#212529',
                  transition: 'color 0.2s'
                }}
              >
                Modo oscuro
              </span>
              <label className="devflow-switch" style={{marginBottom: 0}}>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                <span className="devflow-slider"></span>
              </label>
            </div>
            {location.pathname !== "/dashboard" && (
              <Link
                to="/dashboard"
                className={
                  darkMode ? "btn btn-outline-info btn-sm d-flex align-items-center gap-1 px-2 py-1 rounded-2" : "btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-2 py-1 rounded-2"
                }
                style={{ fontWeight: 500, transition: 'background 0.18s, color 0.18s', marginLeft: 8 }}
              >
                <i className="bi bi-house"></i> Home
              </Link>
            )}
          </div>
        )}
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
