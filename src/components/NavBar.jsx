import React, { useState } from "react";
import logo from "../assets/landing-illustration.svg";
import { useDarkMode } from "../contex/DarkModeContext";
import { getAuth } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";

const NavBar = ({ onLogout, showDarkSwitchOnly }) => {
  const { darkMode, setDarkMode } = useDarkMode();
  const user = getAuth().currentUser;
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const githubUsername = user?.reloadUserInfo?.screenName; // Usado para el texto si no hay displayName
  // Modificado para priorizar githubUsername
  const displayNameToShow = githubUsername || user?.displayName || (user?.email?.split("@")[0] || "Usuario");
  const userIdForProfileLink = user?.uid;

  // Menú de navegación
  const menu = [];

  return (
    <nav className="navbar-devflow w-100 d-flex justify-content-between align-items-center py-3 px-2 px-md-5 mb-4" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center gap-2 flex-shrink-0" style={{ minWidth: 0 }}>
        <img src={logo} alt="DevFlow Logo" style={{ width: 48, height: 48 }} />
        <span className={darkMode ? "fw-bold fs-3 text-info" : "fw-bold fs-3 text-primary"}>DevFlow</span>
      </div>
      <div className="d-flex align-items-center gap-4 flex-shrink-0 ms-auto" style={{ minWidth: 0 }}>
        {showDarkSwitchOnly ? (
          <div className="d-flex align-items-center gap-2 ms-2" style={{height: 24, minWidth: 0}}>
            <span
              className="devflow-switch-label"
              style={{
                fontSize: 15,
                whiteSpace: 'nowrap',
                marginRight: 4,
                color: darkMode ? '#fff' : 'black', // Changed to 'black'
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
          <div className="d-flex align-items-center gap-3 position-relative flex-shrink-0" style={{ minWidth: 0 }}>
            <img src={user.photoURL || 'https://via.placeholder.com/32?text=No+Img'} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: darkMode ? "2px solid #0dcaf0" : "2px solid #0d6efd" }} />
            
            {/* Contenedor para nombre de usuario (link en desktop, activador de menú en responsive) */}
            <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
              {/* Desktop: Nombre como Link (si userIdForProfileLink existe) o texto */}
              {userIdForProfileLink ? (
                <Link
                  to={`/usuario/${userIdForProfileLink}`}
                  className={`${darkMode ? "text-light" : "text-dark"} fw-semibold d-none d-md-inline-block`}
                  style={{ fontSize: 15, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}
                  title={displayNameToShow}
                >
                  {displayNameToShow}
                </Link>
              ) : (
                <span
                  className={`${darkMode ? "text-light" : "text-dark"} fw-semibold d-none d-md-inline-block`}
                  style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}
                  title={displayNameToShow}
                >
                  {displayNameToShow}
                </span>
              )}

              {/* Responsive: Nombre + Icono para abrir menú */}
              <span
                className={`${darkMode ? "text-light" : "text-dark"} fw-semibold user-dropdown-toggle d-flex d-md-none align-items-center`}
                style={{ fontSize: 15, cursor: 'pointer', minWidth: 0 }}
                onClick={() => setShowMenu((v) => !v)}
                tabIndex={0}
                onBlur={() => setTimeout(() => setShowMenu(false), 150)} // Cierra el menú si se pierde el foco
              >
                <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, display: 'inline-block'}} title={displayNameToShow}>
                  {displayNameToShow}
                </span>
                <svg style={{marginLeft: 6, marginBottom: 2}} width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><polygon points="5,8 10,13 15,8" /></svg>
              </span>
            </div>
            
            {/* Menú desplegable solo en responsive */}
            <div className={`user-dropdown-menu${showMenu ? ' show' : ''}`}
              style={{
                position: 'fixed',
                top: 70,
                right: 16,
                minWidth: 180,
                zIndex: 2000,
                display: showMenu ? 'block' : 'none',
                pointerEvents: showMenu ? 'auto' : 'none',
                border: darkMode ? '2px solid #0dcaf0' : '2px solid #0d6efd',
                borderRadius: 12,
                boxShadow: '0 4px 24px #0003'
              }}
              tabIndex={-1}
              onBlur={() => setTimeout(() => setShowMenu(false), 150)}
            >
              <div className={darkMode ? "bg-dark text-light border-info rounded-3 shadow p-2" : "bg-white text-dark border-primary rounded-3 shadow p-2"}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="devflow-switch-label" style={{ fontSize: 15, whiteSpace: 'nowrap', marginRight: 4, color: darkMode ? '#fff' : 'black', transition: 'color 0.2s' }}>Modo oscuro</span> {/* Changed to 'black' */}
                  <label className="devflow-switch" style={{ marginBottom: 0 }}>
                    <input type="checkbox" checked={darkMode} onChange={e => { e.stopPropagation(); toggleDarkMode(); }} />
                    <span className="devflow-slider"></span>
                  </label>
                </div>

                {/* Responsive: Ver Perfil Link */}
                {userIdForProfileLink && (
                  <Link
                    to={`/usuario/${userIdForProfileLink}`}
                    className={darkMode ? "btn btn-outline-light btn-sm w-100 mb-1 d-flex align-items-center" : "btn btn-outline-dark btn-sm w-100 mb-1 d-flex align-items-center"}
                    style={{ fontWeight: 500, transition: 'background 0.18s, color 0.18s', justifyContent: 'flex-start' }}
                    onClick={e => { e.stopPropagation(); setShowMenu(false); }}
                  >
                    <i className="bi bi-person-circle me-1"></i> Ver perfil
                  </Link>
                )}

                {/* Responsive: Home button instead of logout, excepto en dashboard */}
                {location.pathname !== "/dashboard" && (
                  <Link
                    to="/dashboard"
                    className={darkMode ? "btn btn-outline-info btn-sm w-100 mb-1 d-flex align-items-center d-md-none" : "btn btn-outline-primary btn-sm w-100 mb-1 d-flex align-items-center d-md-none"} // Added d-flex align-items-center
                    style={{ fontWeight: 500, transition: 'background 0.18s, color 0.18s', justifyContent: 'flex-start' }} // Added justifyContent: 'flex-start'
                    onClick={e => { e.stopPropagation(); setShowMenu(false); }}
                  >
                    <i className="bi bi-house me-1"></i> Home
                  </Link>
                )}
                {/* Responsive: Logout button solo en dashboard */}
                {location.pathname === "/dashboard" && (
                  <button
                    className={darkMode ? "btn btn-info btn-sm w-100 mb-1 d-flex align-items-center d-md-none" : "btn btn-primary btn-sm w-100 mb-1 d-flex align-items-center d-md-none"}
                    style={{ fontWeight: 500, transition: 'background 0.18s, color 0.18s', justifyContent: 'flex-start' }}
                    onClick={e => { e.stopPropagation(); onLogout && onLogout(); setShowMenu(false); }}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
                  </button>
                )}
              </div>
            </div>
            {/* Desktop: controles normales */}
            <div className="d-none d-md-flex align-items-center gap-2 ms-2 desktop-controls" style={{height: 24, minWidth: 0}}>
              <span className="devflow-switch-label" style={{ fontSize: 15, whiteSpace: 'nowrap', marginRight: 4, color: darkMode ? '#fff' : 'black', transition: 'color 0.2s' }}>Modo oscuro</span> {/* Changed to 'black' */}
              <label className="devflow-switch" style={{marginBottom: 0}}>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                <span className="devflow-slider"></span>
              </label>
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
              {onLogout && (
                <button className={darkMode ? "btn btn-info btn-sm" : "btn btn-primary btn-sm"} onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .desktop-controls { display: none !important; }
          .navbar-devflow { flex-direction: row !important; }
          .navbar-devflow > .d-flex:first-child { justify-content: flex-start !important; }
          .navbar-devflow > .d-flex:last-child { justify-content: flex-end !important; margin-left: auto !important; }
        }
        @media (min-width: 901px) {
          .user-dropdown-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default NavBar;
