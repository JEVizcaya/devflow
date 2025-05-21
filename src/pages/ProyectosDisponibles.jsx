import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { getUserProfile } from "../firebase/firestore";
import { useDarkMode } from "../contex/DarkModeContext";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";

const ProyectosDisponibles = () => {
    const [proyectos, setProyectos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();
    const { darkMode } = useDarkMode();

    useEffect(() => {
        const fetchProyectos = async () => {
            setLoading(true);
            try {
                // Leer proyectos públicos de la colección raíz 'projects'
                const projectsRef = collection(db, "projects");
                const q = query(projectsRef, where("isPublic", "==", true));
                const querySnapshot = await getDocs(q);
                let proyectosData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    ownerId: doc.data().ownerId,
                }));
                // Solo proyectos donde el usuario no es owner ni colaborador
                proyectosData = proyectosData.filter((p) => user && p.ownerId !== user.uid && !(p.collaborators || []).includes(user.uid));
                proyectosData = proyectosData.sort((a, b) => {
                    const getTime = (p) => {
                        if (p.createdAt && p.createdAt.seconds) return p.createdAt.seconds * 1000;
                        if (p.createdAt) return new Date(p.createdAt).getTime();
                        return 0;
                    };
                    return getTime(b) - getTime(a);
                });
                setProyectos(proyectosData);
                // Obtener usuarios únicos
                const uids = Array.from(new Set(proyectosData.map((p) => p.ownerId)));
                const usuariosData = await Promise.all(uids.map((uid) => getUserProfile(uid)));
                setUsuarios(usuariosData.filter(Boolean));
            } catch (e) {
                setError("Error al cargar proyectos disponibles");
            } finally {
                setLoading(false);
            }
        };
        fetchProyectos();
    }, [db, user]);

    const darkBg = {
        background:
            "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)",
        minHeight: "100vh",
    };
    const lightBg = {
        background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)",
        minHeight: "100vh",
    };

    if (loading)
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    if (error)
        return <div className="alert alert-danger text-center my-5">{error}</div>;

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
                        position: "relative",
                    }}
                >
                    <button
                        onClick={() => window.history.back()}
                        aria-label="Cerrar"
                        style={{
                            position: "absolute",
                            top: 18,
                            right: 18,
                            zIndex: 10,
                            background: "none",
                            border: "none",
                            fontSize: 28,
                            fontWeight: 700,
                            color: darkMode ? "#fff" : "#212529",
                            opacity: 0.92,
                            cursor: "pointer",
                            transition: "color 0.2s, opacity 0.2s",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.opacity = 1;
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.opacity = 0.92;
                        }}
                    >
                        &#10005;
                    </button>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                        <h2
                            className={
                                darkMode
                                    ? "fw-bold mb-0 text-info w-100 text-center"
                                    : "fw-bold mb-0 text-primary w-100 text-center"
                            }
                        >
                            Proyectos disponibles
                        </h2>
                    </div>
                    <div style={{ height: 24 }} />
                    <div
                        className="row w-100 justify-content-center g-3"
                        style={{ marginLeft: 0, marginRight: 0 }}
                    >
                        {proyectos.length === 0 ? (
                            <div className="alert alert-info text-center my-5">
                                No hay proyectos disponibles para colaborar.
                            </div>
                        ) : (
                            proyectos.map((p) => {
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
                                const owner = usuarios.find((u) => u.uid === p.ownerId);
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
                                                <div className="mb-2 d-flex flex-row align-items-center justify-content-center w-100" style={{ gap: 12 }}>
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
                                                        <i className="bi bi-person-badge me-1"></i>{owner.displayName || owner.githubUsername || owner.email}
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
                                                            <i className="bi bi-person-circle me-1"></i>{colab.displayName || colab.githubUsername || colab.email}
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
                                                    <Link
                                                      to={`/proyecto/${p.ownerId}/${p.id}`}
                                                      className={darkMode ? "btn btn-outline-success btn-sm" : "btn btn-success btn-sm"}
                                                      style={{ minWidth: 120 }}
                                                    >
                                                      <i className="bi bi-eye"></i> Ver detalle
                                                    </Link>
                                                  </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </section>
            </main>
        </div>
    );
};

export default ProyectosDisponibles;
