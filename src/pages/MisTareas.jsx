import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collectionGroup, getDocs, doc, getDoc } from "firebase/firestore";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTareas = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        // Traer todos los proyectos de todos los usuarios
        const projectsRef = collectionGroup(db, "projects");
        const querySnapshot = await getDocs(projectsRef);
        let tareasAsignadas = [];
        let ownerIds = new Set();
        for (const docSnap of querySnapshot.docs) {
          const project = docSnap.data();
          const ownerId = docSnap.ref.parent.parent.id;
          if (Array.isArray(project.tasks)) {
            project.tasks.forEach((t, idx) => {
              if (t.assignedTo === user.uid) {
                tareasAsignadas.push({
                  ...t,
                  projectId: docSnap.id,
                  ownerId,
                  projectTitle: project.title,
                  idx
                });
                ownerIds.add(ownerId);
              }
            });
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
      } catch (e) {
        setToast({ message: "Error al cargar tareas", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTareas();
  }, [user]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? {background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)", minHeight: "100vh"} : {background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)", minHeight: "100vh"}}>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: '100%', maxWidth: 900 }}>
        <section className={`rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ${darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark"}`} style={{ width: '100%', maxWidth: 600, minWidth: 0, backdropFilter: darkMode ? 'blur(2px)' : undefined, position: 'relative' }}>
          <button
            type="button"
            className="btn-close position-absolute"
            aria-label="Cerrar"
            onClick={() => navigate(-1)}
            style={{ top: 16, right: 16, zIndex: 10, ...(darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}) }}
          ></button>
          <h2 className={darkMode ? "fw-bold text-info mb-2" : "fw-bold text-primary mb-2"}>Mis tareas asignadas</h2>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center my-5">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : tareas.length === 0 ? (
            <div className="alert alert-info">No tienes tareas asignadas como colaborador.</div>
          ) : (
            <div className="d-flex flex-column gap-3 mt-3">
              {tareas.map((t, i) => (
                <Link
                  key={i}
                  to={`/proyecto/${t.ownerId}/${t.projectId}`}
                  className="text-decoration-none"
                  style={{ cursor: 'pointer' }}
                >
                  <div className={darkMode ? "card bg-secondary bg-opacity-25 border-info text-light mb-2" : "card bg-light border-primary text-dark mb-2"}>
                    <div className="card-body py-2 px-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold">{t.title}</span>
                        <span className={t.status === 'pendiente' ? "badge bg-warning text-dark" : t.status === 'en proceso' ? "badge bg-primary" : "badge bg-success"}>{t.status}</span>
                      </div>
                      <div style={{fontSize: 14}} className="mb-1">{t.description}</div>
                      <div style={{fontSize: 13}} className={darkMode ? "mb-2" : "text-muted mb-2"}>
                        <i className="bi bi-kanban me-1"></i>
                        Proyecto: <span className="fw-semibold">{t.projectTitle}</span>
                      </div>
                      <div style={{fontSize: 13}} className={darkMode ? "mb-2" : "text-muted mb-2"}>
                        <i className="bi bi-person-circle me-1"></i>
                        Tarea asignada por: <span className="fw-semibold">{creadores[t.ownerId]?.displayName || creadores[t.ownerId]?.githubUsername || creadores[t.ownerId]?.email || 'Desconocido'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MisTareas;
