import React from "react";
import { useNavigate } from "react-router-dom";
import ProjectForm from "../components/ProjectForm";

const CrearProyecto = ({ setToast }) => {
  const navigate = useNavigate();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: 600 }}>
        <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Volver
        </button>
        <ProjectForm setToast={setToast} />
      </div>
    </div>
  );
};

export default CrearProyecto;
