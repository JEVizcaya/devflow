import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/landing-illustration.svg";
import { signInWithGitHub } from "../firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import NavBar from "../components/NavBar";

const Landing = ({ setToast }) => {
  const { darkMode, setDarkMode } = useDarkMode();

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
      style={darkMode ? darkBg : lightBg}
    >
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100" style={{maxWidth: 900}}>
        <section className={
          `rounded-4 shadow-lg p-4 p-md-5 text-center mb-4 w-100 ` +
          (darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark")
        } style={{maxWidth: 600, backdropFilter: darkMode ? 'blur(2px)' : undefined}}>
          <h1 className={darkMode ? "fw-bold text-info mb-3" : "fw-bold text-primary mb-3"}>
            Gestiona y comparte tus flujos de trabajo de desarrollo
          </h1>
          <p className={darkMode ? "lead text-light-50 mb-4" : "lead text-muted mb-4"}>
            DevFlow es la plataforma donde equipos y desarrolladores pueden documentar, visualizar y compartir procesos de desarrollo de software de forma colaborativa y eficiente.<br />
            <span className="fw-semibold">Accede con tu cuenta de <span className={darkMode ? "text-info" : "text-primary"}>GitHub</span> para empezar.</span>
          </p>
          <button className={darkMode ? "btn btn-info btn-lg px-4 shadow-sm mb-2" : "btn btn-primary btn-lg px-4 shadow-sm mb-2"} onClick={handleLogin}>
            <i className="bi bi-github me-2"></i> Iniciar sesión con GitHub
          </button>
        </section>
        <section className="row w-100 justify-content-center mt-4" style={{maxWidth: 900}}>
          <div className="col-12 col-md-4 mb-3">
            <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow" : "card bg-white text-dark border-primary h-100 shadow-sm"} style={darkMode ? {backdropFilter: 'blur(1.5px)'} : {}}>
              <div className="card-body">
                <i className="bi bi-diagram-3 fs-1 mb-3 text-info"></i>
                <h5 className="card-title fw-bold">Proyectos</h5>
                <p className="card-text">Visualiza y gestiona tus proyectos en un solo lugar.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4 mb-3">
            <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow" : "card bg-white text-dark border-primary h-100 shadow-sm"} style={darkMode ? {backdropFilter: 'blur(1.5px)'} : {}}>
              <div className="card-body">
                <i className="bi bi-people fs-1 mb-3 text-info"></i>
                <h5 className="card-title fw-bold">Colabora fácilmente</h5>
                <p className="card-text">Invita a otros, comenta y mejora los procesos de desarrollo en tiempo real.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4 mb-3">
            <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow" : "card bg-white text-dark border-primary h-100 shadow-sm"} style={darkMode ? {backdropFilter: 'blur(1.5px)'} : {}}>
              <div className="card-body">
                <i className="bi bi-github fs-1 mb-3 text-info"></i>
                <h5 className="card-title fw-bold">Integración GitHub</h5>
                <p className="card-text">Accede de forma segura y conecta tus flujos con tus repositorios GitHub.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-100 text-center py-3 mt-4" style={{fontSize: 14, opacity: 0.7}}>
        © {new Date().getFullYear()} DevFlow — Gestiona y comparte tus flujos de desarrollo
      </footer>
    </div>
  );
};

export default Landing;