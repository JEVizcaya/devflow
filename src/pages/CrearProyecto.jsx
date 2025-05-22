import React from "react";
import ProjectForm from "../components/ProjectForm";
import { useDarkMode } from "../contex/DarkModeContext";

const CrearProyecto = ({ setToast }) => {
  const { darkMode } = useDarkMode();
  return (
    <div
      className="page-container d-flex flex-column align-items-center justify-content-center w-100"
      style={darkMode
        ? { minHeight: "100vh", background: "radial-gradient(ellipse at top left, #232526 60%, #23252600 100%), linear-gradient(135deg, #232526 0%, #414345 100%)" }
        : { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)" }
      }
    >
      <div className="form-wide mx-auto w-100" style={{background: 'transparent', border: 'none', boxShadow: 'none'}}>
        <ProjectForm setToast={setToast} />
      </div>
    </div>
  );
};

export default CrearProyecto;
