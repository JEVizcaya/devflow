import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import { getUserProfile, addCollaboratorToProject, addTaskToProject, getAllUsersExcept } from "../firebase/firestore";
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
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        // NUEVO: Leer proyecto desde la colección raíz 'projects'
        const ref = doc(db, "projects", projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Proyecto no encontrado");
        const projectData = { id: snap.id, ...snap.data() };
        setProject(projectData);
        const ownerProfile = await getUserProfile(projectData.ownerId);
        setOwner(ownerProfile);
        // Obtener info de colaboradores y de asignados a tareas
        const allTaskAssignees = Array.isArray(projectData.tasks)
          ? Array.from(new Set(projectData.tasks.map(t => t.assignedTo).filter(Boolean)))
          : [];
        const allColabUids = Array.isArray(projectData.collaborators) ? projectData.collaborators : [];
        const allUids = Array.from(new Set([...allColabUids, ...allTaskAssignees]));
        if (allUids.length > 0) {
          const infos = await Promise.all(
            allUids.map(uid => getUserProfile(uid))
          );
          setCollaboratorsInfo(infos);
        } else {
          setCollaboratorsInfo([]);
        }
        // Obtener todos los usuarios excepto el actual
        if (user) {
          const users = await getAllUsersExcept(user.uid);
          setAllUsers(users);
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

  const isOwner = user && user.uid === project?.ownerId;
  const isCollaborator = user && Array.isArray(project?.collaborators) && project.collaborators.includes(user.uid);

  // Acciones
  const handleUnirse = async () => {
    try {
      // Actualizar en la colección raíz 'projects', no en users/ownerId/projects
      const db = getFirestore();
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Proyecto no encontrado");
      const data = snap.data();
      if (data.collaborators && data.collaborators.includes(user.uid)) return;
      const newCollaborators = [...(data.collaborators || []), user.uid];
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, { collaborators: newCollaborators }));
      setProject(prev => ({ ...prev, collaborators: newCollaborators }));
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
      // Guardar la tarea en la colección raíz 'projects'
      const db = getFirestore();
      const ref = doc(db, "projects", projectId);
      const newTask = {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssignee,
        status: "pendiente",
        createdAt: new Date().toISOString(),
      };
      // Actualizar el array de tareas y agregar el usuario asignado a collaborators si no está
      const prevTasks = project.tasks || [];
      const prevCollaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
      let newCollaborators = prevCollaborators;
      if (!prevCollaborators.includes(taskAssignee)) {
        newCollaborators = [...prevCollaborators, taskAssignee];
      }
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, {
        tasks: [...prevTasks, newTask],
        collaborators: newCollaborators
      }));
      setProject(prev => ({
        ...prev,
        tasks: [...prevTasks, newTask],
        collaborators: newCollaborators
      }));
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
      // Actualizar el proyecto en la colección raíz 'projects'
      const ref = doc(db, "projects", projectId);
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
      // Eliminar el proyecto de la colección raíz 'projects'
      await deleteDoc(doc(db, "projects", projectId));
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
    // Actualiza en Firestore (colección raíz 'projects')
    try {
      const db = getFirestore();
      const ref = doc(db, "projects", projectId);
      await import("firebase/firestore").then(({ updateDoc }) => updateDoc(ref, { tasks: updatedTasks }));
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
      // Guardar tareas editadas en la colección raíz 'projects'
      const db = getFirestore();
      const ref = doc(db, "projects", projectId);
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
      // Guardar tareas editadas en la colección raíz 'projects'
      const db = getFirestore();
      const ref = doc(db, "projects", projectId);
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
              <div className="card-body position-relative">
                <button
                  type="button"
                  className="btn-close position-absolute"
                  aria-label="Cerrar"
                  onClick={() => navigate(-1)}
                  style={{ top: 12, right: 16, zIndex: 10, filter: darkMode ? 'invert(1)' : 'none', opacity: 0.95 }}
                ></button>
                <h2 className="fw-bold mb-3">{project.title}</h2>
                <p className="mb-3" style={{fontSize: 18}}>{project.description}</p>
                {/* Sección de tareas asignadas: ahora en un div externo, no colapsable ni modal */}
                {showTasks && (
                  <div
                    className="my-4 p-4 rounded-3 shadow border tareas-asignadas-responsive"
                    style={darkMode
                      ? { background: '#232526', borderColor: '#0dcaf0', color: '#fff', maxWidth: 700, margin: '0 auto' }
                      : { background: '#f8fafc', borderColor: '#0d6efd', color: '#222', maxWidth: 700, margin: '0 auto' }
                    }
                  >
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
                            <div key={idx} className={darkMode ? "card bg-secondary bg-opacity-25 border-info text-light" : "card bg-light border-primary text-dark"} style={{marginBottom: 4, position: 'relative'}}>
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
                                {typeof user?.uid === 'string' && typeof task?.assignedTo === 'string' &&
                                  user.uid.trim().toLowerCase() === task.assignedTo.trim().toLowerCase() && (
                                  <div className="mb-2">
                                    <label className="me-2">Cambiar estado:</label>
                                    <select
                                      className="form-select form-select-sm d-inline-block w-auto"
                                      value={task.status}
                                      onChange={e => handleTaskStatusChange(idx, e.target.value)}
                                      style={{maxWidth: 180, display: 'inline-block'}}
                                      disabled={task.status === 'finalizada'}
                                    >
                                      <option value="pendiente">Pendiente</option>
                                      <option value="en proceso">En proceso</option>
                                      <option value="finalizada">Finalizada</option>
                                    </select>
                                  </div>
                                )}
                                {/* Menú de acciones solo para el owner */}
                                {isOwner && (
                                  <div style={{position: 'absolute', top: 10, right: 12, zIndex: 2}} className="task-action-dropdown">
                                    <ActionMenu
                                      onEdit={() => handleOpenEditTask(idx)}
                                      onDelete={() => handleDeleteTask(idx)}
                                      darkMode={darkMode}
                                    />
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
                <div className="d-flex flex-wrap gap-2 mt-4 position-relative align-items-stretch acciones-proyecto-responsive">
                  {/* Menú de acciones para el owner */}
                  {isOwner && (
                    <div style={{position: 'relative', zIndex: 2, minWidth: 170, maxWidth: 220, display: 'flex', alignItems: 'center'}} className="project-action-dropdown order-1 mb-2 mb-lg-0">
                      <ActionMenuProject
                        onAssignTask={handleOpenTaskForm}
                        onEditProject={() => setShowEditForm(true)}
                        onDeleteProject={handleDeleteProject}
                        onShowTasks={() => setShowTasks(v => !v)}
                        showTasks={showTasks}
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                  {/* Responsive: menú desplegable para colaborador */}
                  {!isOwner && isCollaborator && (
                    <div className="d-block d-md-none w-100 collab-action-menu-container"> {/* Added collab-action-menu-container */}
                      <ActionMenuColaborador
                        showTasks={showTasks}
                        setShowTasks={setShowTasks}
                        handleUnirse={handleUnirse}
                        isCollaborator={isCollaborator}
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                  {/* Botones individuales solo en escritorio */}
                  {!isOwner && isCollaborator && (
                    <>
                      <div className="d-none d-md-flex" style={{flex: '1 1 170px', minWidth: 170, maxWidth: 220, alignItems: 'center'}}>
                        <button className="btn btn-outline-info w-100" onClick={handleUnirse} disabled><i className="bi bi-person-check"></i> Ya eres colaborador</button>
                      </div>
                      <div className="d-none d-md-flex collab-tareas-btn-container" style={{flex: '1 1 170px', minWidth: 170, maxWidth: 220, alignItems: 'center'}}> {/* Added collab-tareas-btn-container */}
                        <button
                          className={darkMode ? "btn btn-outline-light w-100" : "btn btn-outline-primary w-100"}
                          onClick={() => setShowTasks(v => !v)}
                          style={{fontWeight: 600, letterSpacing: 0.5, fontSize: 15, borderRadius: 6, minHeight: 40}}
                        >
                          <i className={showTasks ? "bi bi-x-lg me-2" : "bi bi-list-task me-2"}></i>
                          {showTasks ? "Ocultar tareas asignadas" : "Tareas asignadas"}
                        </button>
                      </div>
                    </>
                  )}
                  {/* Botón para unirse como colaborador si NO es owner NI colaborador */}
                  {!isOwner && !isCollaborator && (
                    <div className="w-100 d-flex justify-content-center align-items-center" style={{margin: '0 auto'}}>
                      <button
                        className={darkMode ? "btn btn-success" : "btn btn-success"}
                        style={{ fontWeight: 600, fontSize: 16, borderRadius: 6, minHeight: 44, width: '100%', maxWidth: 350 }}
                        onClick={handleUnirse}
                      >
                        <i className="bi bi-person-plus me-2"></i> Unirse como colaborador
                      </button>
                    </div>
                  )}
                  {/* Botón chat fuera del menú, separado horizontalmente en escritorio */}
                  {(isOwner || isCollaborator) && (
                    <div style={{minWidth: 170, maxWidth: 220, display: 'flex', alignItems: 'center'}} className="order-3 mb-2 mb-lg-0 ms-lg-auto">
                      <button
                        className={darkMode ? "btn btn-outline-light btn-chat-violeta d-flex align-items-center w-100" : "btn btn-outline btn-chat-violeta d-flex align-items-center w-100"}
                        style={{fontWeight: 600, letterSpacing: 0.5, fontSize: 15, borderRadius: 6, minHeight: 40, boxShadow: darkMode ? '0 2px 8px #0004' : '0 2px 8px #0002'}}
                        onClick={() => setShowChat((v) => !v)}
                      >
                        <i className="bi bi-chat-dots me-2"></i> <span className="chat-violeta-text">{showChat ? "Cerrar chat" : "Abrir chat"}</span>
                      </button>
                    </div>
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
                      {allUsers && allUsers.map((user) => (
                        <option key={user.uid} value={user.uid}>
                          {user.displayName || user.githubUsername || user.email}
                        </option>
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
                        <input type="url" className="form-control" name="repo" value={project.repo || ""} onChange={e => setProject({ ...project, repo: e.target.value })} />
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
                        {allUsers && allUsers.map((user) => (
                          <option key={user.uid} value={user.uid}>
                            {user.displayName || user.githubUsername || user.email}
                          </option>
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
  border-color: #fd7e14 !important;
  color: #fd7e14 !important;
  background: transparent !important;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.btn-chat-violeta:hover, .btn-chat-violeta:focus {
  background: #fd7e14 !important;
  color: #fff !important;
  border-color: #fd7e14 !important;
}
.btn-chat-violeta:hover .chat-violeta-text, .btn-chat-violeta:focus .chat-violeta-text {
  color: #fff !important;
}
.btn-chat-violeta .action-violeta-icon {
  color: #fd7e14 !important;
  transition: color 0.15s;
}
.btn-chat-violeta:hover .action-violeta-icon, .btn-chat_violeta:focus .action-violeta-icon {
  color: #fff !important;
}
.btn-outline-light.btn-chat-violeta, .btn-outline-light.btn-chat-violeta .chat-violeta-text, .btn-outline-light.btn-chat-violeta .action-violeta-icon {
  color: #fff !important;
  border-color: #fd7e14 !important;
}
.btn-outline-light.btn-chat-violeta:hover, .btn-outline-light.btn-chat_violeta:focus {
  background: #fd7e14 !important;
  color: #fff !important;
  border-color: #fd7e14 !important;
}
.btn-outline-light.btn-chat-violeta:hover .chat-violeta-text, .btn-outline-light.btn-chat_violeta:focus .chat-violeta-text,
.btn-outline-light.btn-chat-violeta:hover .action-violeta-icon, .btn-outline-light.btn-chat_violeta:focus .action-violeta-icon {
  color: #fff !important;
}
.action-menu-btn {
  transition: background 0.15s, color 0.15s;
  color: #6c757d !important;
  border-color: #6c757d !important;
  background: transparent !important;
}
.action-menu-btn:hover, .action-menu-btn:focus {
  background: #6c757d !important;
  color: #fff !important;
  border-color: #6c757d !important;
}
@media (max-width: 768px) {
  .tareas-asignadas-responsive {
    padding: 1.2rem 0.5rem !important;
    margin-left: -8px !important;
    margin-right: -8px !important;
    border-radius: 12px !important;
    max-width: 98vw !important;
    min-width: 0 !important;
    box-shadow: 0 2px 12px #0003 !important;
  }
  .acciones-proyecto-responsive {
    flex-direction: column !important;
    gap: 0.5rem !important;
  }

  /* Ensure parent containers of buttons/menus take full width */
  .acciones-proyecto-responsive > .project-action-dropdown,
  .acciones-proyecto-responsive > .d-block.d-md-none, /* Applies to collab-action-menu-container before it's hidden */
  .acciones-proyecto-responsive > div.order-3.ms-lg-auto {
    width: 100% !important;
    min-width: 0 !important; /* Override inline min-width */
    max-width: 100% !important; /* Override inline max-width */
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
  }

  /* Ensure component roots within those containers also take full width */
  .acciones-proyecto-responsive .action-menu-project-root,
  .acciones-proyecto-responsive .dropdown { /* Was for ActionMenuColaborador's Dropdown root */
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    display: block !important; /* Important for dropdowns or other non-block roots */
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
  }

  /* Ocultar el menú de acciones del colaborador en responsive */
  .acciones-proyecto-responsive .collab-action-menu-container {
    display: none !important;
  }

  /* Mostrar y dar estilos al contenedor del botón 'Tareas asignadas' del colaborador en responsive */
  .acciones-proyecto-responsive .collab-tareas-btn-container {
    display: flex !important;
    align-items: center !important; /* Mantener alineación vertical si el botón no es display block */
    width: 100% !important;
    min-width: 0 !important;    /* Sobrescribir estilo en línea */
    max-width: 100% !important; /* Sobrescribir estilo en línea */
    flex: none !important;       /* Sobrescribir comportamiento flex en línea */
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
  }

  /* Unificación de TAMAÑO para botones de acción y chat en responsive */
  .acciones-proyecto-responsive .action-menu-project-root > button,
  .acciones-proyecto-responsive .collab-tareas-btn-container > button, /* Botón 'Tareas asignadas' del colaborador */
  .acciones-proyecto-responsive .btn-chat-violeta {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    min-height: 44px !important;
    font-size: 16px !important; /* Afecta el tamaño del texto, que influye en la percepción del tamaño */
    border-radius: 6px !important;
    padding: 12px 16px !important;
    box-sizing: border-box !important; /* Asegura que padding y border se incluyan en width/height */
  }
}
`}
</style>
    </div>
  );
};

function ActionMenu({ onEdit, onDelete, darkMode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const close = e => {
      if (!e.target.closest('.action-menu-root')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="action-menu-root" style={{display: 'inline-block', position: 'relative'}}>
      <button
        className={darkMode ? "btn btn-sm btn-outline-light px-2 py-0" : "btn btn-sm btn-outline-secondary px-2 py-0"}
        style={{border: 'none', background: 'none'}}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        aria-label="Acciones"
        tabIndex={0}
      >
        <i className="bi bi-three-dots-vertical fs-5"></i>
      </button>
      {open && (
        <div
          className={darkMode ? "dropdown-menu show p-0 border-0 shadow bg-dark text-light" : "dropdown-menu show p-0 border-0 shadow bg-white text-dark"}
          style={{position: 'absolute', right: 0, top: 32, minWidth: 120, zIndex: 10, borderRadius: 8, overflow: 'hidden'}}
        >
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: darkMode ? '#a97c50' : '#a97c50'}}
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <i className="bi bi-pencil-fill"></i> Editar
          </button>
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: '#dc3545'}}
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <i className="bi bi-trash-fill"></i> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// Nuevo componente ActionMenuProject (al final del archivo, antes del export default)
function ActionMenuProject({ onAssignTask, onEditProject, onDeleteProject, onShowTasks, showTasks, darkMode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const close = e => {
      if (!e.target.closest('.action-menu-project-root')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="action-menu-project-root" style={{display: 'inline-block', position: 'relative'}}>
      <button
        className={darkMode ? "btn btn-outline-light d-flex align-items-center action-menu-btn" : "btn btn-outline-secondary d-flex align-items-center action-menu-btn"}
        style={{fontWeight: 600, letterSpacing: 0.5, fontSize: 15, borderRadius: 6, minHeight: 40, minWidth: 170, boxShadow: darkMode ? '0 2px 8px #0004' : '0 2px 8px #0002', color: '#6c757d', borderColor: '#6c757d'}}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        aria-label="Acciones del proyecto"
        tabIndex={0}
      >
        <i className="bi bi-sliders me-2"></i> <span>Acciones</span> <i className="bi bi-caret-down-fill ms-1"></i>
      </button>
      {open && (
        <div
          className={darkMode ? "dropdown-menu show p-0 border-0 shadow bg-dark text-light" : "dropdown-menu show p-0 border-0 shadow bg-white text-dark"}
          style={{position: 'absolute', right: 0, top: 42, minWidth: 180, zIndex: 10, borderRadius: 8, overflow: 'hidden'}}
        >
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: '#198754'}} // verde
            onClick={() => { setOpen(false); onAssignTask(); }}
          >
            <i className="bi bi-list-task"></i> Asignar tarea
          </button>
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: '#0d6efd'}}
            onClick={() => { setOpen(false); onEditProject(); }}
          >
            <i className="bi bi-pencil-square"></i> Editar proyecto
          </button>
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: '#dc3545'}}
            onClick={() => { setOpen(false); onDeleteProject(); }}
          >
            <i className="bi bi-trash"></i> Eliminar proyecto
          </button>
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{fontWeight: 500, color: '#ffc107'}} // amarillo
            onClick={() => { setOpen(false); onShowTasks(); }}
          >
            <i className={showTasks ? "bi bi-x-lg" : "bi bi-list-task"}></i> {showTasks ? "Ocultar tareas asignadas" : "Tareas asignadas"}
          </button>
        </div>
      )}
    </div>
  );
}

function ActionMenuColaborador({ showTasks, setShowTasks, handleUnirse, isCollaborator, darkMode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="dropdown w-100" style={{maxWidth: 400, margin: '0 auto'}}>
      <button
        className={darkMode ? "btn btn-outline-light w-100 d-flex justify-content-between align-items-center" : "btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"}
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{fontWeight: 600, fontSize: 16, borderRadius: 6, minHeight: 44}}
      >
        <span><i className="bi bi-sliders me-2"></i>Acciones</span>
        <i className={open ? "bi bi-caret-up-fill" : "bi bi-caret-down-fill"}></i>
      </button>
      {open && (
        <div className={darkMode ? "dropdown-menu show w-100 p-0 border-0 shadow bg-dark text-light" : "dropdown-menu show w-100 p-0 border-0 shadow bg-white text-dark"} style={{borderRadius: 8, marginTop: 4, overflow: 'hidden', minWidth: 0}}>
          <button className="dropdown-item d-flex align-items-center gap-2" style={{fontWeight: 500}} onClick={handleUnirse} disabled>
            <i className="bi bi-person-check"></i> Ya eres colaborador
          </button>
          <button className="dropdown-item d-flex align-items-center gap-2" style={{fontWeight: 500}} onClick={() => setShowTasks(v => !v)}>
            <i className={showTasks ? "bi bi-x-lg" : "bi bi-list-task"}></i> {showTasks ? "Ocultar tareas asignadas" : "Tareas asignadas"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProyectoDetalle;
