import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import NavBar from "../components/NavBar";
import { useDarkMode } from "../contex/DarkModeContext";
import { Link } from "react-router-dom";

const MisProyectos = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const { darkMode } = useDarkMode();

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
    if (!user) {
      setError("No estás autenticado");
      setLoading(false);
      return;
    }

    const fetchProyectos = async () => {
      try {
        const projectsRef = collection(db, "users", user.uid, "projects");
        const querySnapshot = await getDocs(projectsRef);
        let proyectosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        proyectosData = proyectosData.sort((a, b) => {
          const getTime = (p) => {
            if (p.createdAt && p.createdAt.seconds) return p.createdAt.seconds * 1000;
            if (p.createdAt) return new Date(p.createdAt).getTime();
            return 0;
          };
          return getTime(b) - getTime(a);
        });
        setProyectos(proyectosData);
      } catch (e) {
        setError("Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, [user, db]);

  if (loading)
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  if (error)
    return <div className="alert alert-danger text-center my-5">{error}</div>;
  if (proyectos.length === 0)
    return (
      <div className="alert alert-info text-center my-5">
        No tienes proyectos aún.
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
        style={{ width: "100%", maxWidth: 900 }}
      >
        <section
          className={`rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ${
            darkMode
              ? "bg-dark bg-opacity-75 border border-info text-light"
              : "bg-white border border-primary text-dark"
          }`}
          style={{
            width: "100%",
            maxWidth: 700,
            minWidth: 0,
            backdropFilter: darkMode ? "blur(2px)" : undefined,
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
            <h2
              className={
                (darkMode ? "fw-bold mb-0 text-info" : "fw-bold mb-0 text-primary") +
                " w-100 text-center text-md-start"
              }
              style={{ marginBottom: 0 }}
            >
              Mis Proyectos
            </h2>
            <Link
              to="/dashboard"
              className={
                darkMode ? "btn btn-outline-info mt-3 mt-md-0" : "btn btn-outline-primary mt-3 mt-md-0"
              }
            >
              <i className="bi bi-house"></i> Home
            </Link>
          </div>
          <div
            className="row w-100 justify-content-center g-3"
            style={{ marginLeft: 0, marginRight: 0 }}
          >
            {proyectos.map((p) => {
              let fecha = "";
              if (p.createdAt) {
                try {
                  // Firestore Timestamp o Date
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
              return (
                <div key={p.id} className="col-12 d-flex justify-content-center">
                  <div
                    className={
                      darkMode
                        ? "card bg-dark text-light border-info h-100 shadow flex-fill overflow-hidden"
                        : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill overflow-hidden"
                    }
                    style={darkMode ? { backdropFilter: "blur(1.5px)", width: 600, maxWidth: '98vw' } : { width: 600, maxWidth: '98vw' }}
                  >
                    <div className="card-body d-flex flex-column h-100 w-100" style={{maxWidth: 580, margin: '0 auto'}}>
                      <div>
                        <h5 className="card-title fw-bold mb-2">{p.title}</h5>
                        <p className="card-text mb-2" style={{ minHeight: 48, wordBreak: 'break-word' }}>
                          {p.description}
                        </p>
                      </div>
                      <div
                        className="d-flex flex-wrap align-items-center gap-2 w-100 mt-auto justify-content-start"
                        style={{
                          paddingTop: 8,
                          borderTop: "1px solid #e0e0e0",
                          overflow: 'hidden',
                        }}
                      >
                        <a
                          href={p.repo}
                          target="_blank"
                          rel="noreferrer"
                          className={
                            darkMode
                              ? "btn btn-outline-info btn-sm"
                              : "btn btn-outline-primary btn-sm"
                          }
                          style={{maxWidth: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}
                        >
                          <i className="bi bi-github"></i> Repositorio
                        </a>
                        <span
                          className={
                            p.isPublic ? "badge bg-success" : "badge bg-secondary"
                          }
                          style={{whiteSpace: 'nowrap'}}
                        >
                          {p.isPublic ? "Público" : "Privado"}
                        </span>
                        {fecha && (
                          <span
                            className="badge bg-light text-dark border border-secondary mt-1"
                            style={{ fontSize: "0.85em", opacity: 0.85, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                            title={fecha}
                          >
                            <i className="bi bi-calendar-event me-1"></i> {fecha}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MisProyectos;
