import React, { useState } from "react";
import { addProject } from "../firebase/firestore";
import { getAuth } from "firebase/auth";

const ProjectForm = ({ setToast, onProjectSaved }) => {
  const user = getAuth().currentUser;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repo, setRepo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = {
        title,
        description,
        repo,
        isPublic,
      };
      await addProject(user.uid, project);
      setToast && setToast({ message: "Proyecto guardado", type: "success" });
      setTitle("");
      setDescription("");
      setRepo("");
      setIsPublic(true);
      onProjectSaved && onProjectSaved();
    } catch (err) {
      setToast && setToast({ message: "Error al guardar el proyecto", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit} style={{ maxWidth: 800, width: "100%" }}>
      <h4 className="mb-3">Nuevo Proyecto</h4>
      <div className="mb-3">
        <label className="form-label">Título</label>
        <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Descripción</label>
        <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} required rows={3} />
      </div>
      <div className="mb-3">
        <label className="form-label">Enlace al repositorio</label>
        <input type="url" className="form-control" value={repo} onChange={e => setRepo(e.target.value)} required placeholder="https://github.com/usuario/repositorio" />
      </div>
      <div className="form-check form-switch mb-3">
        <input className="form-check-input" type="checkbox" id="publicSwitch" checked={isPublic} onChange={() => setIsPublic(v => !v)} />
        <label className="form-check-label" htmlFor="publicSwitch">
          {isPublic ? "Público" : "Privado"}
        </label>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-secondary w-50" type="button" onClick={() => window.history.back()}>
          <i className="bi bi-arrow-left"></i> Volver
        </button>
        <button className="btn btn-primary w-50" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Proyecto"}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
