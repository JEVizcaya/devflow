import React from "react";
import { getAuth } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import logo from "../assets/landing-illustration.svg";
import NavBar from "../components/NavBar";

const Dashboard = ({ setToast }) => {
  const user = getAuth().currentUser;
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();

  const handleLogout = async () => {
    await logout();
    setToast && setToast({ message: "Sesión cerrada", type: "success" });
    navigate("/");
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Mejoras visuales para dark mode
  const darkBg = {
    background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)",
    minHeight: "100vh"
  };
  const lightBg = {
    background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)",
    minHeight: "100vh"
  };

  return (
    <div
      className={
        "d-flex flex-column align-items-center justify-content-center px-2 w-100"
      }
      style={{ ...(darkMode ? darkBg : lightBg), overflowX: 'hidden' }}
    >
      <NavBar onLogout={handleLogout} />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: '100%', maxWidth: 900 }}>
        <section className={
          `rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ` +
          (darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark")
        }
          style={{ width: '100%', maxWidth: 600, minWidth: 0, backdropFilter: darkMode ? 'blur(2px)' : undefined }}>
          {user && (
            <>
              <h2 className={darkMode ? "fw-bold text-info mb-2" : "fw-bold text-primary mb-2"}>
                ¡Hola, {user.reloadUserInfo && user.reloadUserInfo.screenName ? user.reloadUserInfo.screenName : user.email.split("@")[0]}!
              </h2>
              <p className={darkMode ? "lead text-light-50 mb-4" : "lead text-muted mb-4"}>
                Bienvenido a tu espacio de trabajo colaborativo.<br />
                Aquí podrás crear, visualizar y compartir flujos de desarrollo con tu equipo.
              </p>
              <Link to="/crear-proyecto" className={darkMode ? "btn btn-info" : "btn btn-primary"}>
                <i className="bi bi-plus-circle me-1"></i> Crear proyecto
              </Link>
            </>
          )}
        </section>
        <section className="row w-100 justify-content-center mt-4 g-3" style={{ width: '100%', maxWidth: 900, minWidth: 0, marginLeft: 0, marginRight: 0 }}>
          <div className="col-12 col-sm-6 col-lg-4 mb-3 d-flex">
            <Link
              to="/mis-proyectos"
              className="text-decoration-none flex-fill"
            >
              <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow" : "card bg-white text-dark border-primary h-100 shadow-sm"} style={darkMode ? { backdropFilter: 'blur(1.5px)' } : {}}>
                <div className="card-body">
                  <i className="bi bi-folder2-open fs-1 mb-3 text-info"></i>
                  <h5 className="card-title fw-bold">Proyectos</h5>
                  <p className="card-text">Visualiza y gestiona proyectos de desarrollo en un solo lugar. Accede a detalles, repositorios y privacidad.</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-12 col-sm-6 col-lg-4 mb-3 d-flex">
            <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow flex-fill" : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill"} style={darkMode ? { backdropFilter: 'blur(1.5px)' } : {}}>
              <div className="card-body">
                <i className="bi bi-people fs-1 mb-3 text-info"></i>
                <h5 className="card-title fw-bold">Colaboración</h5>
                <p className="card-text">Invita a tu equipo, comenta y mejora los procesos de desarrollo en tiempo real.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4 mb-3 d-flex">
            <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow flex-fill" : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill"} style={darkMode ? { backdropFilter: 'blur(1.5px)' } : {}}>
              <div className="card-body">
                <i className="bi bi-github fs-1 mb-3 text-info"></i>
                <h5 className="card-title fw-bold">Integración GitHub</h5>
                <p className="card-text">Conecta tus flujos con tus repositorios y automatiza tareas desde GitHub.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-100 text-center py-3 mt-4" style={{ fontSize: 14, opacity: 0.7 }}>
        © {new Date().getFullYear()} DevFlow — Plataforma colaborativa de flujos de desarrollo
      </footer>
    </div>
  );
};

export default Dashboard;