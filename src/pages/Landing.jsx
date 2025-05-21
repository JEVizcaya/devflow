import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/landing-illustration.svg";
import { signInWithGitHub } from "../firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Landing = ({ setToast }) => {
  const { darkMode, setDarkMode } = useDarkMode();

  // Sincroniza el modo oscuro con body y html para asegurar fondo global
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogin = async () => {
    try {
      await signInWithGitHub();
      setToast && setToast({ message: "¡Sesión iniciada con GitHub!", type: "success" });
    } catch (error) {
      setToast && setToast({ message: "Error al iniciar sesión con GitHub", type: "error" });
    }
  };

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
      style={{ ...(darkMode ? darkBg : lightBg), maxWidth: 1400, margin: '0 auto' }}
    >
      <NavBar showDarkSwitchOnly />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100" style={{maxWidth: 1200}}>
        <section className={
          `rounded-4 shadow-lg p-3 p-md-4 text-center mb-4 w-100 ` +
          (darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark")
        } style={{maxWidth: 700, backdropFilter: darkMode ? 'blur(2px)' : undefined, margin: '0 auto', paddingTop: 18, paddingBottom: 18}}>
          <h1 className={darkMode ? "fw-bold text-info mb-2" : "fw-bold text-primary mb-2"} style={{fontSize: '1.6rem'}}>
            Gestiona y comparte tus flujos de trabajo de desarrollo
          </h1>
          <p className={darkMode ? "lead text-light-50 mb-3" : "lead text-muted mb-3"} style={{fontSize: '1.05rem'}}>
            DevFlow es la plataforma donde equipos y desarrolladores pueden documentar, visualizar y compartir procesos de desarrollo de software de forma colaborativa y eficiente.<br />
            <span className="fw-semibold">Accede con tu cuenta de <span className={darkMode ? "text-info" : "text-primary"}>GitHub</span> para empezar.</span>
          </p>
          <button className={darkMode ? "btn btn-info btn-lg px-4 shadow-sm mb-2" : "btn btn-primary btn-lg px-4 shadow-sm mb-2"} onClick={handleLogin}>
            <i className="bi bi-github me-2"></i> Iniciar sesión con GitHub
          </button>
        </section>
        {/* Enlace eliminado porque ProyectosPublicos ya no existe */}
      </main>
      <footer className={darkMode ? "w-100 text-center py-3 mt-4 text-white" : "w-100 text-center py-3 mt-4"} style={{fontSize: 14, opacity: 0.7, maxWidth: 1400, margin: '0 auto'}}>
        © {new Date().getFullYear()} DevFlow — Gestiona y comparte tus flujos de desarrollo
      </footer>
    </div>
  );
};

export default Landing;