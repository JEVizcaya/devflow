import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import { getUserProfile, addCollaboratorToProject, addTaskToProject } from "../firebase/firestore";
import NavBar from "../components/NavBar";
import ChatProyecto from "../components/ChatProyecto";
import Toast from "../components/Toast";

const ProyectoDetalle = () => {
  const { ownerId, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [toast, setToast] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const ref = doc(db, "users", ownerId, "projects", projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Proyecto no encontrado");
        setProject({ id: snap.id, ...snap.data() });
        const ownerProfile = await getUserProfile(ownerId);
        setOwner(ownerProfile);
      } catch (e) {
        setToast({ message: "No se pudo cargar el proyecto", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ownerId, projectId]);

  if (loading) return <div className="container d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  if (!project) return <div className="alert alert-danger text-center my-5">No se encontró el proyecto.</div>;

  const isOwner = user && user.uid === ownerId;
  const isCollaborator = user && (project.collaborators || []).includes(user.uid);

  // Acciones
  const handleUnirse = async () => {
    try {
      await addCollaboratorToProject(ownerId, projectId, user.uid);
      setProject(prev => ({ ...prev, collaborators: [...(prev.collaborators || []), user.uid] }));
      setToast({ message: "Te has unido como colaborador", type: "success" });
    } catch {
      setToast({ message: "Error al unirse como colaborador", type: "error" });
    }
  };

  const handleOpenTaskForm = () => {
    setShowTaskForm(true);
    setTaskTitle("");
    setTaskDesc("");
    setTaskAssignee("");
  };
  const handleCloseTaskForm = () => setShowTaskForm(false);

  const handleAddTask = async () => {
    if (!taskTitle || !taskAssignee) return;
    setUpdatingTask(true);
    try {
      await addTaskToProject(ownerId, projectId, {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssignee,
        status: "pendiente",
        createdAt: new Date().toISOString(),
      });
      setProject(prev => ({ ...prev, tasks: [...(prev.tasks || []), { title: taskTitle, description: taskDesc, assignedTo: taskAssignee, status: "pendiente", createdAt: new Date().toISOString() }] }));
      setToast({ message: "Tarea asignada", type: "success" });
      handleCloseTaskForm();
    } catch {
      setToast({ message: "Error al asignar tarea", type: "error" });
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleEditProject = () => {
    navigate(`/editar-proyecto/${ownerId}/${projectId}`);
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "users", ownerId, "projects", projectId));
      setToast({ message: "Proyecto eliminado correctamente", type: "success" });
      setTimeout(() => navigate("/mis-proyectos"), 1200);
    } catch {
      setToast({ message: "Error al eliminar el proyecto", type: "error" });
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? {background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)", minHeight: "100vh"} : {background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)", minHeight: "100vh"}}>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: '100%', maxWidth: 1100 }}>
        <section className="row w-100 justify-content-center g-3" style={{maxWidth: 1100}}>
          <div className="col-12 col-lg-8 mb-3">
            <div className={darkMode ? "card bg-dark text-light border-info shadow-lg" : "card bg-white text-dark border-primary shadow-lg"}>
              <div className="card-body">
                <h2 className="fw-bold mb-3">{project.title}</h2>
                <p className="mb-3" style={{fontSize: 18}}>{project.description}</p>
                {/* Eliminar datos de repo, público/privado, fecha y colaboradores de los detalles */}
                {/* Acciones según rol */}
                <div className="d-flex flex-wrap gap-2 mt-4">
                  {isOwner && (
                    <>
                      <button className="btn btn-outline-success" onClick={handleOpenTaskForm}><i className="bi bi-list-task"></i> Asignar tarea</button>
                      <button className="btn btn-outline-warning" onClick={handleEditProject}><i className="bi bi-pencil-square"></i> Editar proyecto</button>
                      <button className="btn btn-outline-danger" onClick={handleDeleteProject}><i className="bi bi-trash"></i> Eliminar proyecto</button>
                    </>
                  )}
                  {isCollaborator && !isOwner && (
                    <button className="btn btn-outline-info" onClick={handleUnirse} disabled><i className="bi bi-person-check"></i> Ya eres colaborador</button>
                  )}
                  {!isOwner && !isCollaborator && (
                    <button className="btn btn-outline-info" onClick={handleUnirse}><i className="bi bi-person-plus"></i> Unirse como colaborador</button>
                  )}
                  {(isOwner || isCollaborator) && (
                    <button
                      className={darkMode ? "btn btn-outline-info" : "btn btn-outline-primary"}
                      onClick={() => setShowChat((v) => !v)}
                    >
                      <i className="bi bi-chat-dots"></i> {showChat ? "Cerrar chat" : "Abrir chat"}
                    </button>
                  )}
                </div>
                {/* Formulario modal para asignar tarea */}
                {showTaskForm && isOwner && (
                  <div className="modal d-block" tabIndex="-1" style={{background: '#0008'}}>
                    <div className="modal-dialog modal-dialog-centered">
                      <div className={darkMode ? "modal-content bg-dark text-light" : "modal-content bg-white text-dark"}>
                        <div className="modal-header">
                          <h5 className="modal-title">Asignar tarea</h5>
                          <button type="button" className="btn-close" onClick={handleCloseTaskForm}></button>
                        </div>
                        <div className="modal-body">
                          <input type="text" className="form-control mb-2" placeholder="Título de la tarea" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                          <textarea className="form-control mb-2" placeholder="Descripción" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={2} />
                          <select className="form-select mb-2" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                            <option value="">Asignar a...</option>
                            {project.collaborators && project.collaborators.map(uid => (
                              <option key={uid} value={uid}>{uid === ownerId && owner ? (owner.displayName || owner.githubUsername || owner.email) : "Colaborador"}</option>
                            ))}
                          </select>
                        </div>
                        <div className="modal-footer">
                          <button className="btn btn-secondary" onClick={handleCloseTaskForm}>Cancelar</button>
                          <button className="btn btn-success" onClick={handleAddTask} disabled={!taskTitle || !taskAssignee || updatingTask}>{updatingTask ? "Asignando..." : "Asignar"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Chat lateral como sidebar */}
          {showChat && (isOwner || isCollaborator) && (
            <div className="col-12 col-lg-4 mb-3">
              <ChatProyecto
                ownerId={ownerId}
                projectId={projectId}
                collaborators={project.collaborators}
                onClose={() => setShowChat(false)}
                sidebar
              />
            </div>
          )}
        </section>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ProyectoDetalle;
