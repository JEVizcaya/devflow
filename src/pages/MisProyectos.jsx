import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getUserProfile } from "../firebase/firestore";
import NavBar from "../components/NavBar";
import { useDarkMode } from "../contex/DarkModeContext";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const MisProyectos = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [toast, setToast] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // Fondos como en Dashboard
  const darkBg = {
    background:
      "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)",
    minHeight: "100vh",
  };
  const lightBg = {
    background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)",
    minHeight: "100vh",
  };

  useEffect(() => {
    const fetchProyectosYUsuarios = async () => {
      setLoading(true);
      try {
        // Traer todos los proyectos donde ownerId es el usuario actual
        const projectsRef = collection(db, "projects");
        const querySnapshot = await getDocs(projectsRef);
        let proyectosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          ownerId: doc.data().ownerId,
        }));
        proyectosData = proyectosData.filter(p => p.ownerId === user.uid);
        proyectosData = proyectosData.sort((a, b) => {
          const getTime = (p) => {
            if (p.createdAt && p.createdAt.seconds) return p.createdAt.seconds * 1000;
            if (p.createdAt) return new Date(p.createdAt).getTime();
            return 0;
          };
          return getTime(b) - getTime(a);
        });
        setProyectos(proyectosData);
        // Obtener todos los colaboradores únicos de los proyectos
        const colabUids = Array.from(new Set(
          proyectosData.flatMap(p => Array.isArray(p.collaborators) ? p.collaborators : [])
        ));
        const allUids = Array.from(new Set([...proyectosData.map(p => p.ownerId), ...colabUids]));
        const usuariosData = await Promise.all(allUids.map(uid => getUserProfile(uid)));
        setUsuarios(usuariosData.filter(Boolean));
      } catch (e) {
        setError("Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    };
    fetchProyectosYUsuarios();
  }, [db]);

  if (loading)
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 w-100" style={darkMode ? darkBg : lightBg}>
        <NavBar />
        <div className="d-flex justify-content-center align-items-center flex-grow-1 w-100" style={{minHeight: 300}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  if (error)
    return <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 w-100" style={darkMode ? darkBg : lightBg}><NavBar /><div className="alert alert-danger text-center my-5">{error}</div></div>;
  if (proyectos.length === 0)
    return (
      <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? darkBg : lightBg}>
        <NavBar />
        <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: "100%", maxWidth: 1200 }}>
          <section className={`rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ${darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark"}`} style={{ width: "100%", maxWidth: 1000, minWidth: 0, backdropFilter: darkMode ? "blur(2px)" : undefined, position: "relative" }}>
            <button
              type="button"
              className="btn-close position-absolute"
              aria-label="Cerrar"
              onClick={() => navigate("/dashboard")}
              style={{ top: 16, right: 16, zIndex: 10, ...(darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}) }}
            ></button>
            <div className="d-flex flex-row justify-content-between align-items-center mb-4" style={{position: 'relative'}}>
              <h2 className={darkMode ? "fw-bold mb-0 text-info w-100 text-center" : "fw-bold mb-0 text-primary w-100 text-center"} style={{flex: 1, marginBottom: 0}}>
                Mis proyectos
              </h2>
            </div>
            <div style={{ height: 24 }} />
            <div className="alert alert-info text-center my-5">
              No tienes proyectos aún.
            </div>
          </section>
        </main>
      </div>
    );

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center px-2 w-100"
      style={darkMode ? darkBg : lightBg}
    >
      <NavBar />
      <main
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0"
        style={{ width: "100%", maxWidth: 1200 }}
      >
        <section
          className={`rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ${darkMode
              ? "bg-dark bg-opacity-75 border border-info text-light"
              : "bg-white border border-primary text-dark"
            }`}
          style={{
            width: "100%",
            maxWidth: 1000,
            minWidth: 0,
            backdropFilter: darkMode ? "blur(2px)" : undefined,
            position: "relative" // Para posicionar la X
          }}
        >
          <button
            type="button"
            className="btn-close position-absolute"
            aria-label="Cerrar"
            onClick={() => navigate("/dashboard")}
            style={{ top: 16, right: 16, zIndex: 10, ...(darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}) }}
          ></button>
          {/* Fin botón X */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
            <h2
              className={
                (darkMode ? "fw-bold mb-0 text-info" : "fw-bold mb-0 text-primary") +
                " w-100 text-center"
              }
              style={{ marginBottom: 0 }}
            >
              Mis proyectos 
            </h2>
          </div>
          <div style={{height: 32}} />
          <div
            className="row w-100 justify-content-center g-3"
            style={{ marginLeft: 0, marginRight: 0 }}
          >
            {proyectos
              .filter(p => p.ownerId === user.uid)
              .map((p) => {
                let fecha = "";
                if (p.createdAt) {
                  try {
                    const dateObj = p.createdAt.seconds
                      ? new Date(p.createdAt.seconds * 1000)
                      : new Date(p.createdAt);
                    fecha = dateObj.toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  } catch {
                    fecha = "";
                  }
                }
                const owner = usuarios.find(u => u.uid === p.ownerId);
                return (
                  <div key={p.id} className="col-12 d-flex justify-content-center px-1 px-sm-2" style={{ maxWidth: 900, margin: '0 auto', marginBottom: 28 }}>
                    <div
                      className={
                        darkMode
                          ? "card bg-dark text-light border-info h-100 shadow flex-fill overflow-hidden project-card-hover"
                          : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill overflow-hidden project-card-hover"
                      }
                      style={{
                        backdropFilter: darkMode ? "blur(1.5px)" : undefined,
                        width: "100%",
                        maxWidth: 900,
                        minWidth: 0,
                        margin: 0,
                        boxSizing: "border-box"
                      }}
                    >
                      <div className="card-body d-flex flex-column h-100 w-100" style={{ maxWidth: 880, margin: '0 auto', padding: 0 }}>
                          <h5 className="card-title fw-bold mb-2">{p.title}</h5>
                          <p className="card-text mb-2" style={{ minHeight: 48, wordBreak: 'break-word' }}>
                            {p.description}
                          </p>
                          <div className="mb-2">
                            <span className={p.isPublic ? "badge bg-success ms-1" : "badge bg-danger ms-1"}>
                              {p.isPublic ? "Público" : "Privado"}
                            </span>
                            {fecha && (
                              <span className="badge bg-light text-dark border border-secondary ms-1" style={{ fontSize: "0.95em", opacity: 0.85 }}>
                                <i className="bi bi-calendar-event me-1"></i> {fecha}
                              </span>
                            )}
                          </div>
                          <div className="mb-2">
                            <b>Creador:</b>{" "}
                            {owner ? (
                              <span className="badge bg-info text-dark ms-1">
                                <i className="bi bi-person-badge me-1"></i>{owner.githubUsername || owner.displayName || owner.email}
                              </span>
                            ) : (
                              <span className="text-muted">Desconocido</span>
                            )}
                          </div>
                          <div className="mb-2">
                            <b>Colaboradores:</b>{" "}
                            {(p.collaborators && p.collaborators.length > 0) ? (
                              p.collaborators.map((uid, idx) => {
                                const colab = usuarios.find(u => u.uid === uid);
                                return colab ? (
                                  <span key={uid} className="badge bg-secondary text-light me-1">
                                    <i className="bi bi-person-circle me-1"></i>{colab.githubUsername || colab.displayName || colab.email}
                                  </span>
                                ) : null;
                              })
                            ) : (
                              <span className="text-muted">Ninguno</span>
                            )}
                          </div>
                        {/* Botón de repositorio y Ver detalle alineados horizontalmente y centrados */}
                        <div className="mt-2 d-flex flex-row align-items-center justify-content-center gap-3">
                          <a
                            href={p.repo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={darkMode ? "btn btn-outline-info btn-sm" : "btn btn-outline-primary btn-sm"}
                            tabIndex={-1}
                            style={{ minWidth: 120, background: !darkMode ? '#174ea6' : undefined, color: !darkMode ? '#fff' : undefined, borderColor: !darkMode ? '#174ea6' : undefined }}
                          >
                            <i className="bi bi-github"></i> Repositorio
                          </a>
                          <button
                            className={darkMode ? "btn btn-outline-success btn-sm" : "btn btn-success btn-sm"}
                            onClick={() => navigate(`/proyecto/${p.ownerId}/${p.id}`)}
                            style={{ minWidth: 120 }}
                          >
                            <i className="bi bi-eye"></i> Ver detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

        </section>
      </main>
      {/* Toast de feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MisProyectos;

/* Opcional: estilos para resaltar la tarjeta al pasar el mouse */
// En tu CSS global o App.css puedes agregar:
// .project-card-hover:hover { box-shadow: 0 0 24px #0dcaf0cc, 0 2px 8px #0002; transform: translateY(-2px) scale(1.01); z-index: 2; }
