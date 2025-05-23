import React, { useState } from "react";
import { addProject } from "../firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../contex/DarkModeContext";

const ProjectForm = ({ setToast, onProjectSaved }) => {
  const { darkMode } = useDarkMode();
  const user = getAuth().currentUser;
  const navigate = useNavigate();
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
        ownerId: user.uid,
        collaborators: [], // Inicializa colaboradores
        tasks: [],         // Inicializa tareas
        createdAt: new Date(),
      };
      await addProject(user.uid, project);
      setToast && setToast({ message: "Proyecto guardado", type: "success" });
      setTitle("");
      setDescription("");
      setRepo("");
      setIsPublic(true);
      onProjectSaved && onProjectSaved();
      navigate("/dashboard");
    } catch (err) {
      setToast && setToast({ message: "Error al guardar el proyecto", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={darkMode ? "my-5 w-100 bg-dark text-light border-info rounded-3 shadow-lg" : "my-5 w-100 bg-white text-dark border-primary rounded-3 shadow-lg"}
      onSubmit={handleSubmit}
      style={{ padding: "2rem 1rem", maxWidth: 520, margin: "0 auto", border: '2px solid', borderColor: darkMode ? '#0dcaf0' : '#0d6efd' }}
    >
      <div className="w-100" style={{ width: "100%" }}>
        <h4 className={darkMode ? "mb-4 text-info" : "mb-4 text-primary"}>Nuevo Proyecto</h4>

        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Enlace al repositorio</label>
          <input
            type="url"
            className="form-control"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            
            placeholder="https://github.com/usuario/repositorio"
          />
        </div>

        <div className="form-check form-switch mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            id="publicSwitch"
            checked={isPublic}
            onChange={() => setIsPublic((v) => !v)}
          />
          <label className="form-check-label" htmlFor="publicSwitch">
            {isPublic ? "Público" : "Privado"}
          </label>
        </div>

        <div className="d-flex justify-content-center gap-2">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => window.history.back()}
            style={{
              padding: "6px 14px",
              fontSize: "0.9rem",
              height: "auto",
            }}
          >
            <i className="bi bi-arrow-left me-1"></i> Volver
          </button>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{
              padding: "6px 14px",
              fontSize: "0.9rem",
              height: "auto",
            }}
          >
            {loading ? "Guardando..." : "Guardar Proyecto"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProjectForm;
