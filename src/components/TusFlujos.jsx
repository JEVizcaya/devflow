import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";

const TusFlujos = () => {
  const user = getAuth().currentUser;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      setLoading(true);
      const colRef = collection(db, "users", user.uid, "projects");
      const snap = await getDocs(colRef);
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="text-center py-4">Cargando proyectos...</div>;
  if (projects.length === 0) return <div className="text-center py-4">No tienes proyectos aún.</div>;

  return (
    <div className="row w-100 justify-content-center mt-2 g-3" style={{ maxWidth: 900 }}>
      {projects.map(proj => (
        <div className="col-12 col-md-6 col-lg-4 d-flex" key={proj.id}>
          <div className="card flex-fill shadow-sm border-primary">
            <div className="card-body">
              <h5 className="card-title fw-bold">{proj.title}</h5>
              <p className="card-text">{proj.description}</p>
              <a href={proj.repo} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm mb-2">
                <i className="bi bi-github"></i> Repositorio
              </a>
              <div>
                <span className={proj.isPublic ? "badge bg-success" : "badge bg-secondary"}>
                  {proj.isPublic ? "Público" : "Privado"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TusFlujos;
