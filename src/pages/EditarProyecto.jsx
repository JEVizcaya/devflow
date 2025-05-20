import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useDarkMode } from "../contex/DarkModeContext";
import NavBar from "../components/NavBar";

const EditarProyecto = () => {
  const { ownerId, projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const ref = doc(db, "users", ownerId, "projects", projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Proyecto no encontrado");
        setProject({ id: snap.id, ...snap.data() });
      } catch (e) {
        setError("No se pudo cargar el proyecto");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [ownerId, projectId]);

  const handleChange = e => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleSwitch = e => {
    setProject({ ...project, isPublic: e.target.checked });
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const db = getFirestore();
      const ref = doc(db, "users", ownerId, "projects", projectId);
      await setDoc(ref, {
        ...project,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      navigate("/mis-proyectos");
    } catch (e) {
      setError("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center my-5">{error}</div>;
  if (!project) return null;
  if (!user || user.uid !== ownerId) return <div className="alert alert-warning text-center my-5">No tienes permiso para editar este proyecto.</div>;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-2 w-100" style={darkMode ? {background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)", minHeight: "100vh"} : {background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)", minHeight: "100vh"}}>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100 px-0" style={{ width: '100%', maxWidth: 900 }}>
        <section className={
          `rounded-4 shadow-lg p-3 p-md-5 text-center mb-4 w-100 ` +
          (darkMode ? "bg-dark bg-opacity-75 border border-info text-light" : "bg-white border border-primary text-dark")
        }
          style={{ width: '100%', maxWidth: 600, minWidth: 0, backdropFilter: darkMode ? 'blur(2px)' : undefined }}>
          <h2 className={darkMode ? "fw-bold text-info mb-3" : "fw-bold text-primary mb-3"}>Editar Proyecto</h2>
          <form onSubmit={handleSave} className="w-100" style={{maxWidth: 500, margin: "0 auto"}}>
            <div className="mb-3 text-start">
              <label className="form-label">Título</label>
              <input type="text" className="form-control" name="title" value={project.title || ""} onChange={handleChange} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Descripción</label>
              <textarea className="form-control" name="description" value={project.description || ""} onChange={handleChange} rows={3} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Enlace al repositorio</label>
              <input type="url" className="form-control" name="repo" value={project.repo || ""} onChange={handleChange} required />
            </div>
            <div className="form-check form-switch mb-4 text-start">
              <input className="form-check-input" type="checkbox" id="publicSwitch" checked={!!project.isPublic} onChange={handleSwitch} />
              <label className="form-check-label" htmlFor="publicSwitch">{project.isPublic ? "Público" : "Privado"}</label>
            </div>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-outline-secondary" type="button" onClick={() => navigate("/mis-proyectos")}>Cancelar</button>
              <button className="btn btn-success" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default EditarProyecto;
