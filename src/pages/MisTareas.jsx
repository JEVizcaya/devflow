import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useDarkMode } from "../contex/DarkModeContext";
import NavBar from "../components/NavBar";
import Toast from "../components/Toast";
import { getUserProfile } from "../firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

const MisTareas = () => {
  const { darkMode } = useDarkMode();
  const user = getAuth().currentUser;
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [creadores, setCreadores] = useState({});
  const [proyectosColaborador, setProyectosColaborador] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTareasYProyectos = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const projectsRef = collection(db, "projects");
        const querySnapshot = await getDocs(projectsRef);
        let tareasAsignadas = [];
        let proyectosColaborador = [];
        let ownerIds = new Set();
        let proyectosConTarea = new Set();
        for (const docSnap of querySnapshot.docs) {
          const project = docSnap.data();
          const ownerId = project.ownerId;
          let tieneTareaAsignada = false;
          // Tareas asignadas
          if (Array.isArray(project.tasks)) {
            project.tasks.forEach((t, idx) => {
              if (t.assignedTo === user.uid && t.status !== 'finalizada') {
                tareasAsignadas.push({
                  ...t,
                  projectId: docSnap.id,
                  ownerId,
                  projectTitle: project.title,
                  idx
                });
                ownerIds.add(ownerId);
                proyectosConTarea.add(docSnap.id);
                tieneTareaAsignada = true;
              }
            });
          }
          // Si el usuario es colaborador (pero no owner), mostrar siempre el proyecto (tenga o no tareas asignadas)
          if (
            Array.isArray(project.collaborators) &&
            project.collaborators.includes(user.uid) &&
            ownerId !== user.uid
          ) {
            proyectosColaborador.push({
              projectId: docSnap.id,
              ownerId,
              projectTitle: project.title,
              projectDescription: project.description,
              projectStatus: project.status || '',
            });
            ownerIds.add(ownerId);
          }
        }
        // Obtener info de creadores
        const creadorArr = await Promise.all(
          Array.from(ownerIds).map(uid => getUserProfile(uid))
        );
        const creadorMap = {};
        creadorArr.forEach(c => { if (c) creadorMap[c.uid] = c; });
        setCreadores(creadorMap);
        setTareas(tareasAsignadas);
        setProyectosColaborador(proyectosColaborador);
      } catch (e) {
        setToast({ message: "Error al cargar tareas", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTareasYProyectos();
  }, [user]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? {background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)", minHeight: "100vh"} : {background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)", minHeight: "100vh"}}>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: '100%', maxWidth: 1100 }}>
        <section className={`rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ${darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark"}`} style={{ width: '100%', maxWidth: 900, minWidth: 0, backdropFilter: darkMode ? 'blur(2px)' : undefined, position: 'relative' }}>
          <button
            type="button"
            className="btn-close position-absolute"
            aria-label="Cerrar"
            onClick={() => navigate(-1)}
            style={{ top: 16, right: 16, zIndex: 10, ...(darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}) }}
          ></button>
          {/* Mis tareas asignadas */}
          <h2 className={darkMode ? "fw-bold text-info mb-2 text-center" : "fw-bold text-primary mb-2 text-center"}>Mis tareas asignadas</h2>
          <div style={{height: 32}} />
          {loading ? (
            <div className="d-flex justify-content-center align-items-center my-5">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : tareas.length === 0 && proyectosColaborador.length === 0 ? (
            <div className="alert alert-info">No participas en ningún proyecto como colaborador.</div>
          ) : (
            <>
              {tareas.length === 0 ? (
                <div className="alert alert-info">No tienes tareas asignadas.</div>
              ) : (
                <div className="d-flex flex-column gap-3 mt-3">
                  {tareas.map((t, i) => (
                    <Link
                      key={i}
                      to={`/proyecto/${t.ownerId}/${t.projectId}`}
                      className="text-decoration-none"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={darkMode ? "card bg-secondary bg-opacity-25 border-info text-light mb-2" : "card bg-light border-primary text-dark mb-2"} style={{maxWidth: 880, margin: '0 auto'}}>
                        <div className="card-body py-3 px-4">
                          <div className="d-flex flex-column align-items-center mb-2">
                            <span className="fw-bold w-100 text-center d-block mb-2" style={{fontSize: 18}}>{t.title}</span>
                          </div>
                          <div style={{fontSize: 15}} className="mb-3 text-center">{t.description}</div>
                          <div style={{fontSize: 13}} className={darkMode ? "mb-3" : "text-muted mb-3"}>
                            <i className="bi bi-kanban me-1"></i>
                            Proyecto: <span className="fw-semibold">{t.projectTitle}</span>
                          </div>
                          <div style={{fontSize: 13}} className={darkMode ? "mb-3" : "text-muted mb-3"}>
                            <i className="bi bi-person-circle me-1"></i>
                            Tarea asignada por: <span className="fw-semibold">{creadores[t.ownerId]?.githubUsername || creadores[t.ownerId]?.displayName || creadores[t.ownerId]?.email || 'Desconocido'}</span>
                          </div>
                          <div className="w-100 d-flex justify-content-center mt-2">
                            <span className={t.status === 'pendiente' ? "badge bg-warning text-dark" : t.status === 'en proceso' ? "badge bg-primary" : "badge bg-success"} style={{fontSize: 13}}>{t.status}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {/* Proyectos donde soy colaborador pero no tengo tareas asignadas */}
              <h2 className={darkMode ? "fw-bold text-info mb-2 text-center mt-5 mb-4" : "fw-bold text-primary mb-2 text-center mt-5 mb-4"}>Proyectos en los que participo como colaborador</h2>
              <div style={{height: 32}} />
              {proyectosColaborador.length === 0 ? (
                <div className="alert alert-info">No colaboras en ningún proyecto.</div>
              ) : (
                <div className="d-flex flex-column gap-3 mt-4 mb-5 pb-5">
                  {proyectosColaborador.map((p, i) => (
                    <Link
                      key={p.projectId}
                      to={`/proyecto/${p.ownerId}/${p.projectId}`}
                      className="text-decoration-none"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={darkMode ? "card bg-secondary bg-opacity-25 border-info text-light mb-2" : "card bg-light border-primary text-dark mb-2"} style={{maxWidth: 880, margin: '0 auto'}}>
                        <div className="card-body py-3 px-4">
                          <div className="d-flex flex-column align-items-center mb-2">
                            <span className="fw-bold w-100 text-center d-block mb-2" style={{fontSize: 18}}>{p.projectTitle}</span>
                            {/* Puedes mostrar el estado del proyecto si lo tienes */}
                          </div>
                          <div style={{fontSize: 15}} className="mb-3 text-center">{p.projectDescription}</div>
                          <div style={{fontSize: 13}} className={darkMode ? "mb-1" : "text-muted mb-1"}>
                            <i className="bi bi-person-circle me-1"></i>
                            Creador: <span className="fw-semibold">{creadores[p.ownerId]?.githubUsername || creadores[p.ownerId]?.displayName || creadores[p.ownerId]?.email || 'Desconocido'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MisTareas;
