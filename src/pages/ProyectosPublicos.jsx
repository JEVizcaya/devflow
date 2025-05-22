import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import db, { getUserProfile } from "../firebase/firestore";
import { useDarkMode } from "../contex/DarkModeContext";
import NavBar from "../components/NavBar";

const ProyectosPublicos = () => {
    const [proyectos, setProyectos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { darkMode } = useDarkMode();

    useEffect(() => {
        const fetchProyectos = async () => {
            setLoading(true);
            try {
                // Consulta solo proyectos públicos en la colección raíz
                const projectsRef = collection(db, "projects");
                const q = query(projectsRef, where("isPublic", "==", true));
                const querySnapshot = await getDocs(q);
                let proyectosData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    ownerId: doc.data().ownerId,
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
                // Obtener usuarios únicos
                const uids = Array.from(new Set(proyectosData.map((p) => p.ownerId)));
                const usuariosData = await Promise.all(uids.map((uid) => getUserProfile(uid)));
                setUsuarios(usuariosData.filter(Boolean));
            } catch (e) {
                setError("Error al cargar proyectos públicos");
            } finally {
                setLoading(false);
            }
        };
        fetchProyectos();
    }, []);

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
        <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? darkBg : lightBg}>
            <NavBar />
            <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: "100%", maxWidth: 1200 }}>
                <section
                    className={`rounded-4 shadow-lg p-3 p-md-4 text-center mb-4 w-100 ${darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark"}`}
                    style={{
                        width: "100%",
                        maxWidth: 1000,
                        minWidth: 0,
                        backdropFilter: darkMode ? "blur(2px)" : undefined,
                        position: "relative",
                        marginTop: 48
                    }}
                >
                    {/* Botón X para cerrar */}
                    <button
                        onClick={() => window.history.back()}
                        aria-label="Cerrar"
                        className="btn-close position-absolute d-block"
                        style={{
                            top: 18,
                            right: 18,
                            zIndex: 10,
                            fontSize: 28,
                            fontWeight: 700,
                            color: darkMode ? "#fff" : "#212529",
                            opacity: 0.92,
                            cursor: "pointer",
                            transition: "color 0.2s, opacity 0.2s",
                            background: "none",
                            border: "none",
                            lineHeight: 1,
                            padding: 0,
                        }}
                        onMouseOver={e => { e.currentTarget.style.opacity = 1; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = 0.92; }}
                    >
                        <span aria-hidden="true">&#10005;</span>
                    </button>
                    {/* Fin botón X */}
                    <h2 className={darkMode ? "fw-bold mb-0 text-info w-100 text-center" : "fw-bold mb-0 text-primary w-100 text-center"}>Proyectos públicos</h2>
                    <div style={{ height: 32 }} />
                    {/* Mostrar solo los 6 últimos proyectos en 2 filas de 3 columnas */}
                    <div className="row w-100 justify-content-center g-4" style={{ marginLeft: 0, marginRight: 0, marginTop: 8 }}>
                        {proyectos.slice(0, 6).map((p, idx) => {
                            const owner = usuarios.find((u) => u.uid === p.ownerId);
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
                            return (
                                <div key={p.id} className="col-12 col-md-4 d-flex justify-content-center px-1 px-sm-2 mb-4" style={{ maxWidth: 400, margin: '0 auto' }}>
                                    <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow flex-fill overflow-hidden project-card-hover" : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill overflow-hidden project-card-hover"} style={{ backdropFilter: darkMode ? "blur(1.5px)" : undefined, width: "100%", maxWidth: 400, minWidth: 0, margin: 0, boxSizing: "border-box", cursor: "default" }}>
                                        <div className="card-body d-flex flex-column h-100 w-100" style={{ maxWidth: 380, margin: '0 auto', padding: 0 }}>
                                            <div>
                                                <h5 className="card-title fw-bold mb-2">{p.title}</h5>
                                                <p className="card-text mb-2" style={{ minHeight: 48, wordBreak: 'break-word' }}>{p.description}</p>
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

export default ProyectosPublicos;
