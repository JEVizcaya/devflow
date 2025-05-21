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
  const [showTasks, setShowTasks] = useState(false);
  const [collaboratorsInfo, setCollaboratorsInfo] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskIdx, setDeleteTaskIdx] = useState(null);
  const [editTaskIdx, setEditTaskIdx] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("");
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
        const projectData = { id: snap.id, ...snap.data() };
        setProject(projectData);
        const ownerProfile = await getUserProfile(ownerId);
        setOwner(ownerProfile);
        // Obtener info de colaboradores
        if (projectData.collaborators && projectData.collaborators.length > 0) {
          const infos = await Promise.all(
            projectData.collaborators.map(uid => getUserProfile(uid))
          );
          setCollaboratorsInfo(infos);
        } else {
          setCollaboratorsInfo([]);
        }
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
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => setShowEditForm(false);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setUpdatingTask(true);
    try {
      const db = getFirestore();
      const ref = doc(db, "users", ownerId, "projects", projectId);
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, {
        title: project.title,
        description: project.description,
        repo: project.repo,
        isPublic: project.isPublic,
        updatedAt: new Date().toISOString(),
      }));
      setToast({ message: "Proyecto actualizado", type: "success" });
      setShowEditForm(false);
    } catch {
      setToast({ message: "Error al guardar cambios", type: "error" });
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDeleteProject = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    setShowDeleteConfirm(false);
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "users", ownerId, "projects", projectId));
      setToast({ message: "Proyecto eliminado correctamente", type: "success" });
      setTimeout(() => navigate("/mis-proyectos"), 1200);
    } catch {
      setToast({ message: "Error al eliminar el proyecto", type: "error" });
    }
  };

  const handleTaskStatusChange = async (taskIdx, newStatus) => {
    if (!project || !project.tasks) return;
    const updatedTasks = project.tasks.map((t, idx) => idx === taskIdx ? { ...t, status: newStatus } : t);
    setProject(prev => ({ ...prev, tasks: updatedTasks }));
    // Actualiza en Firestore
    try {
      const db = getFirestore();
      const ref = doc(db, "users", ownerId, "projects", projectId);
      await ref.update ? ref.update({ tasks: updatedTasks }) : await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, { tasks: updatedTasks }));
      setToast({ message: "Estado de la tarea actualizado", type: "success" });
    } catch (e) {
      setToast({ message: "Error al actualizar el estado: " + (e.message || e), type: "error" });
    }
  };

  const handleDeleteTask = (idx) => {
    setDeleteTaskIdx(idx);
  };

  const confirmDeleteTask = async () => {
    if (deleteTaskIdx === null) return;
    const updatedTasks = project.tasks.filter((_, idx) => idx !== deleteTaskIdx);
    setProject(prev => ({ ...prev, tasks: updatedTasks }));
    setDeleteTaskIdx(null);
    try {
      const db = getFirestore();
      const ref = doc(db, "users", ownerId, "projects", projectId);
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, { tasks: updatedTasks }));
      setToast({ message: "Tarea eliminada", type: "success" });
    } catch {
      setToast({ message: "Error al eliminar la tarea", type: "error" });
    }
  };

  const handleOpenEditTask = (idx) => {
    const t = project.tasks[idx];
    setEditTaskIdx(idx);
    setEditTaskTitle(t.title);
    setEditTaskDesc(t.description);
    setEditTaskAssignee(t.assignedTo);
    setEditTaskStatus(t.status);
  };
  const handleCloseEditTask = () => setEditTaskIdx(null);

  const handleSaveEditTask = async () => {
    if (!editTaskTitle || !editTaskAssignee) return;
    setUpdatingTask(true);
    try {
      const updatedTasks = project.tasks.map((t, idx) => idx === editTaskIdx ? {
        ...t,
        title: editTaskTitle,
        description: editTaskDesc,
        assignedTo: editTaskAssignee,
        status: editTaskStatus
      } : t);
      setProject(prev => ({ ...prev, tasks: updatedTasks }));
      setEditTaskIdx(null);
      const db = getFirestore();
      const ref = doc(db, "users", ownerId, "projects", projectId);
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, { tasks: updatedTasks }));
      setToast({ message: "Tarea actualizada", type: "success" });
    } catch {
      setToast({ message: "Error al editar la tarea", type: "error" });
    } finally {
      setUpdatingTask(false);
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
                <div className="d-flex justify-content-start mb-3">
                  <button className={darkMode ? "btn btn-outline-light" : "btn btn-outline-secondary"} onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Volver
                  </button>
                </div>
                <h2 className="fw-bold mb-3">{project.title}</h2>
                <p className="mb-3" style={{fontSize: 18}}>{project.description}</p>
                {/* Sección de tareas asignadas: ahora en un div externo, no colapsable ni modal */}
                {showTasks && (
                  <div className="my-4 p-4 rounded-3 shadow border" style={darkMode ? {background: '#232526', borderColor: '#0dcaf0', color: '#fff', maxWidth: 700, margin: '0 auto'} : {background: '#f8fafc', borderColor: '#0d6efd', color: '#222', maxWidth: 700, margin: '0 auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className={darkMode ? "text-info mb-0" : "text-primary mb-0"}><i className="bi bi-list-task me-2"></i>Tareas asignadas</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => setShowTasks(false)}
                        style={darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}}
                      ></button>
                    </div>
                    {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {project.tasks.map((task, idx) => {
                          const assignedColab = collaboratorsInfo.find(c => c && c.uid === task.assignedTo);
                          return (
                            <div key={idx} className={darkMode ? "card bg-secondary bg-opacity-25 border-info text-light" : "card bg-light border-primary text-dark"} style={{marginBottom: 4}}>
                              <div className="card-body py-2 px-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fw-bold">{task.title}</span>
                                  <span className={task.status === 'pendiente' ? "badge bg-warning text-dark" : task.status === 'en proceso' ? "badge bg-primary" : "badge bg-success"}>{task.status}</span>
                                </div>
                                <div style={{fontSize: 14}} className="mb-1">{task.description}</div>
                                <div style={{fontSize: 13}} className={darkMode ? "mb-2" : "text-muted mb-2"}>
                                  <i className="bi bi-person-circle me-1" style={darkMode ? { color: '#fff' } : {}}></i>
                                  {isOwner
                                    ? (
                                      <>
                                        <span className="fw-semibold" style={darkMode ? { color: '#fff' } : {}}>Tarea asignada a:</span>
                                        <span style={darkMode ? { color: '#fff', fontWeight: 600, marginLeft: 4 } : { fontWeight: 600, marginLeft: 4 }}>
                                          {assignedColab ? (assignedColab.displayName || assignedColab.githubUsername || assignedColab.email) : 'Sin asignar'}
                                        </span>
                                      </>
                                    )
                                    : (
                                      <>
                                        <span className="fw-semibold" style={darkMode ? { color: '#fff' } : {}}>Tarea asignada por:</span>
                                        <span style={darkMode ? { color: '#fff', fontWeight: 600, marginLeft: 4 } : { fontWeight: 600, marginLeft: 4 }}>
                                          {owner ? (owner.displayName || owner.githubUsername || owner.email) : 'Creador desconocido'}
                                        </span>
                                      </>
                                    )
                                  }
                                </div>
                                {user && user.uid === task.assignedTo && (
                                  <div className="mb-2">
                                    <label className="me-2">Cambiar estado:</label>
                                    <select
                                      className="form-select form-select-sm d-inline-block w-auto"
                                      value={task.status}
                                      onChange={e => handleTaskStatusChange(idx, e.target.value)}
                                      style={{maxWidth: 180, display: 'inline-block'}}
                                    >
                                      <option value="pendiente">Pendiente</option>
                                      <option value="en proceso">En proceso</option>
                                      <option value="finalizada">Finalizada</option>
                                    </select>
                                  </div>
                                )}
                                {isOwner && (
                                  <div className="d-flex justify-content-center gap-2 mt-2">
                                    <button
                                      className="btn btn-sm btn-outline-brown"
                                      style={{borderColor: '#a97c50', color: '#a97c50'}}
                                      onClick={() => handleOpenEditTask(idx)}
                                    >
                                      <i className="bi bi-pencil-fill"></i> Editar
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteTask(idx)}
                                    >
                                      <i className="bi bi-trash-fill"></i> Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={darkMode ? "text-white" : "text-muted"}>No hay tareas asignadas.</div>
                    )}
                  </div>
                )}
                {/* Fin sección tareas asignadas */}
                {/* Eliminar datos de repo, público/privado, fecha y colaboradores de los detalles */}
                {/* Acciones según rol */}
                <div className="d-flex flex-wrap gap-2 mt-4">
                  {isCollaborator && !isOwner && (
                    <button className="btn btn-outline-info" onClick={handleUnirse} disabled><i className="bi bi-person-check"></i> Ya eres colaborador</button>
                  )}
                  {isOwner && (
                    <>
                      <button className="btn btn-outline-success" onClick={handleOpenTaskForm}><i className="bi bi-list-task"></i> Asignar tarea</button>
                      <button className="btn btn-outline-brown" style={{borderColor: '#a97c50', color: '#a97c50'}} onClick={() => setShowEditForm(true)}><i className="bi bi-pencil-square"></i> Editar proyecto</button>
                      <button className="btn btn-outline-danger" onClick={handleDeleteProject}><i className="bi bi-trash"></i> Eliminar proyecto</button>
                    </>
                  )}
                  {/* Botón Tareas asignadas solo una vez, nunca duplicado */}
                  <button
                    className={darkMode ? "btn btn-outline-info" : "btn btn-outline-primary"}
                    onClick={() => setShowTasks(v => !v)}
                  >
                    <i className={showTasks ? "bi bi-x-lg me-2" : "bi bi-list-task me-2"}></i>
                    {showTasks ? "Ocultar tareas asignadas" : "Tareas asignadas"}
                  </button>
                  {(isOwner || isCollaborator) && (
                    <button
                      className={darkMode ? "btn btn-outline-light btn-chat-violeta" : "btn btn-outline btn-chat-violeta"}
                      onClick={() => setShowChat((v) => !v)}
                    >
                      <i className="bi bi-chat-dots"></i> <span className="chat-violeta-text">{showChat ? "Cerrar chat" : "Abrir chat"}</span>
                    </button>
                  )}
                  {!isOwner && !isCollaborator && (
                    <button className="btn btn-outline-info" onClick={handleUnirse}><i className="bi bi-person-plus"></i> Unirse como colaborador</button>
                  )}
                </div>
                {/* Formulario para asignar tarea: ahora en un div externo, no modal */}
                {showTaskForm && isOwner && (
                  <div className="my-4 p-4 rounded-3 shadow border" style={darkMode ? {background: '#232526', borderColor: '#0dcaf0', color: '#fff', maxWidth: 520, margin: '0 auto'} : {background: '#f8fafc', borderColor: '#0d6efd', color: '#222', maxWidth: 520, margin: '0 auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className={darkMode ? "text-info mb-0" : "text-primary mb-0"}><i className="bi bi-list-task me-2"></i>Asignar tarea</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={handleCloseTaskForm}
                        style={darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}}
                      ></button>
                    </div>
                    <input type="text" className="form-control mb-2" placeholder="Título de la tarea" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                    <textarea className="form-control mb-2" placeholder="Descripción" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={2} />
                    <select className="form-select mb-2" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                      <option value="">Asignar a...</option>
                      {collaboratorsInfo && collaboratorsInfo.map((colab, idx) => (
                        colab ? (
                          <option key={colab.uid} value={colab.uid}>
                            {colab.displayName || colab.githubUsername || colab.email}
                          </option>
                        ) : null
                      ))}
                    </select>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                      <button className="btn btn-secondary" onClick={handleCloseTaskForm}>Cancelar</button>
                      <button className="btn btn-success" onClick={handleAddTask} disabled={!taskTitle || !taskAssignee || updatingTask}>{updatingTask ? "Asignando..." : "Asignar"}</button>
                    </div>
                  </div>
                )}
                {/* Formulario para editar proyecto */}
                {showEditForm && isOwner && (
                  <div className="my-4 p-4 rounded-3 shadow border" style={darkMode ? {background: '#232526', borderColor: '#0dcaf0', color: '#fff', maxWidth: 520, margin: '0 auto'} : {background: '#f8fafc', borderColor: '#0d6efd', color: '#222', maxWidth: 520, margin: '0 auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className={darkMode ? "text-info mb-0" : "text-primary mb-0"}><i className="bi bi-pencil-square me-2"></i>Editar proyecto</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={handleCloseEditForm}
                        style={darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}}
                      ></button>
                    </div>
                    <form onSubmit={handleSaveEdit} className="w-100" style={{maxWidth: 500, margin: "0 auto"}}>
                      <div className="mb-3 text-start">
                        <label className="form-label">Título</label>
                        <input type="text" className="form-control" name="title" value={project.title || ""} onChange={e => setProject({ ...project, title: e.target.value })} required />
                      </div>
                      <div className="mb-3 text-start">
                        <label className="form-label">Descripción</label>
                        <textarea className="form-control" name="description" value={project.description || ""} onChange={e => setProject({ ...project, description: e.target.value })} rows={3} required />
                      </div>
                      <div className="mb-3 text-start">
                        <label className="form-label">Enlace al repositorio</label>
                        <input type="url" className="form-control" name="repo" value={project.repo || ""} onChange={e => setProject({ ...project, repo: e.target.value })} required />
                      </div>
                      <div className="form-check form-switch mb-4 text-start">
                        <input className="form-check-input" type="checkbox" id="publicSwitch" checked={!!project.isPublic} onChange={e => setProject({ ...project, isPublic: e.target.checked })} />
                        <label className="form-check-label" htmlFor="publicSwitch">{project.isPublic ? "Público" : "Privado"}</label>
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-secondary" type="button" onClick={handleCloseEditForm}>Cancelar</button>
                        <button className="btn btn-success" type="submit" disabled={updatingTask}>{updatingTask ? "Guardando..." : "Guardar cambios"}</button>
                      </div>
                    </form>
                  </div>
                )}
                {/* Formulario para editar tarea */}
                {editTaskIdx !== null && (
                  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(0,0,0,0.45)', zIndex: 9999}}>
                    <div className={darkMode ? "bg-dark text-light border-info" : "bg-white text-dark border-primary"} style={{border: '2px solid', borderRadius: 16, minWidth: 0, width: '95vw', maxWidth: 380, boxShadow: '0 4px 32px #0008', padding: 32, margin: 8, boxSizing: 'border-box'}}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className={darkMode ? "text-info mb-0" : "text-primary mb-0"}><i className="bi bi-pencil-square me-2"></i>Editar tarea</h5>
                        <button
                          type="button"
                          className="btn-close"
                          aria-label="Cerrar"
                          onClick={handleCloseEditTask}
                          style={darkMode ? { filter: 'invert(1)', opacity: 0.95 } : {}}
                        ></button>
                      </div>
                      <input type="text" className="form-control mb-2" placeholder="Título de la tarea" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} />
                      <textarea className="form-control mb-2" placeholder="Descripción" value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} rows={2} />
                      <select className="form-select mb-2" value={editTaskAssignee} onChange={e => setEditTaskAssignee(e.target.value)}>
                        <option value="">Asignar a...</option>
                        {collaboratorsInfo && collaboratorsInfo.map((colab, idx) => (
                          colab ? (
                            <option key={colab.uid} value={colab.uid}>
                              {colab.displayName || colab.githubUsername || colab.email}
                            </option>
                          ) : null
                        ))}
                      </select>
                      <select className="form-select mb-3" value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en proceso">En proceso</option>
                        <option value="finalizada">Finalizada</option>
                      </select>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-secondary" onClick={handleCloseEditTask}>Cancelar</button>
                        <button className="btn btn-success" onClick={handleSaveEditTask} disabled={!editTaskTitle || !editTaskAssignee || updatingTask}>{updatingTask ? "Guardando..." : "Guardar cambios"}</button>
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
      {showDeleteConfirm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(0,0,0,0.45)', zIndex: 9999}}>
          <div className={darkMode ? "bg-dark text-light border-info" : "bg-white text-dark border-danger"} style={{border: '2px solid', borderRadius: 16, minWidth: 0, width: '95vw', maxWidth: 380, boxShadow: '0 4px 32px #0008', padding: 32, margin: 8, boxSizing: 'border-box'}}>
            <div className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-danger fs-3"></i>
              <h5 className="mb-0">¿Eliminar proyecto?</h5>
            </div>
            <p className="mb-4">Esta acción <b>no se puede deshacer</b>.<br />¿Seguro que deseas eliminar este proyecto?</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDeleteProject}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {deleteTaskIdx !== null && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(0,0,0,0.45)', zIndex: 9999}}>
          <div className={darkMode ? "bg-dark text-light border-info" : "bg-white text-dark border-danger"} style={{border: '2px solid', borderRadius: 16, minWidth: 0, width: '95vw', maxWidth: 380, boxShadow: '0 4px 32px #0008', padding: 32, margin: 8, boxSizing: 'border-box'}}>
            <div className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-danger fs-3"></i>
              <h5 className="mb-0">¿Eliminar tarea?</h5>
            </div>
            <p className="mb-4">Esta acción <b>no se puede deshacer</b>.<br />¿Seguro que deseas eliminar esta tarea asignada?</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setDeleteTaskIdx(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDeleteTask}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      <style>
{`
.btn-chat-violeta {
  border-color: #a259f7 !important;
  color: #a259f7 !important;
  background: transparent !important;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.btn-chat-violeta:hover, .btn-chat-violeta:focus {
  background: #a259f7 !important;
  color: #fff !important;
  border-color: #a259f7 !important;
}
.chat-violeta-text {
  color: #a259f7 !important;
}
.btn-chat-violeta:hover .chat-violeta-text, .btn-chat-violeta:focus .chat-violeta-text {
  color: #fff !important;
}
.btn-outline-brown {
  border-color: #a97c50 !important;
  color: #a97c50 !important;
  background: transparent !important;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.btn-outline-brown:hover, .btn-outline-brown:focus {
  background: #a97c50 !important;
  color: #fff !important;
  border-color: #a97c50 !important;
}
`}
</style>
    </div>
  );
};

export default ProyectoDetalle;
