import React, { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
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
                const projectsRef = collectionGroup(db, "projects");
                const querySnapshot = await getDocs(projectsRef);
                let proyectosData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    ownerId: doc.ref.parent.parent.id,
                }));
                console.log("Total proyectos encontrados:", proyectosData.length, proyectosData.map(p => ({ id: p.id, isPublic: p.isPublic })));
                proyectosData = proyectosData.filter((p) => p.isPublic);
                console.log("Proyectos públicos:", proyectosData.length, proyectosData.map(p => p.id));
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
                <section className={`rounded-4 shadow-lg p-3 p-md-4 text-center mb-4 w-100 ${darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark"}`} style={{ width: "100%", maxWidth: 1000, minWidth: 0, backdropFilter: darkMode ? "blur(2px)" : undefined, position: "relative" }}>
                    <h2 className={darkMode ? "fw-bold mb-0 text-info w-100 text-center" : "fw-bold mb-0 text-primary w-100 text-center"}>Proyectos públicos</h2>
                    <div className="row w-100 justify-content-center g-3" style={{ marginLeft: 0, marginRight: 0 }}>
                        {proyectos.length === 0 ? (
                            <div className="alert alert-info text-center my-5">No hay proyectos públicos disponibles.</div>
                        ) : (
                            proyectos.map((p) => {
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
                                    <div key={p.id} className="col-12 d-flex justify-content-center px-1 px-sm-2" style={{ maxWidth: 900, margin: '0 auto' }}>
                                        <div className={darkMode ? "card bg-dark text-light border-info h-100 shadow flex-fill overflow-hidden project-card-hover" : "card bg-white text-dark border-primary h-100 shadow-sm flex-fill overflow-hidden project-card-hover"} style={{ backdropFilter: darkMode ? "blur(1.5px)" : undefined, width: "100%", maxWidth: 900, minWidth: 0, margin: 0, boxSizing: "border-box", cursor: "default" }}>
                                            <div className="card-body d-flex flex-column h-100 w-100" style={{ maxWidth: 880, margin: '0 auto', padding: 0 }}>
                                                <div>
                                                    <h5 className="card-title fw-bold mb-2">{p.title}</h5>
                                                    <p className="card-text mb-2" style={{ minHeight: 48, wordBreak: 'break-word' }}>{p.description}</p>
                                                    <div className="mb-2">
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
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ProyectosPublicos;
