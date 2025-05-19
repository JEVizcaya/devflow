import React from "react";

const IntegracionGithub = () => (
  <div className="text-center py-4">
    <h4 className="mb-3"><i className="bi bi-github text-info"></i> Integración GitHub</h4>
    <p>Accede con tu cuenta de GitHub para vincular tus proyectos y flujos de trabajo.</p>
    <ul className="list-group list-group-flush mb-3">
      <li className="list-group-item">Autenticación segura con GitHub</li>
      <li className="list-group-item">Enlaza tus repositorios a cada proyecto</li>
      <li className="list-group-item">Automatiza tareas y despliegues (próximamente)</li>
    </ul>
    <div className="alert alert-info mt-3" role="alert">
      Más integraciones y automatizaciones estarán disponibles en futuras versiones.
    </div>
  </div>
);

export default IntegracionGithub;
