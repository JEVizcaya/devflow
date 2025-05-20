import React from "react";
import ProjectForm from "../components/ProjectForm";

const CrearProyecto = ({ setToast }) => {
  return (
    <div
      className="page-container d-flex flex-column align-items-center justify-content-center w-100"
      style={{ minHeight: "100vh" }}
    >
      <div className="form-wide mx-auto w-100">
        <ProjectForm setToast={setToast} />
      </div>
    </div>
  );
};

export default CrearProyecto;
