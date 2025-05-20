import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getUserProfile } from "../firebase/getUserProfile";

const PerfilUsuario = () => {
  const user = getAuth().currentUser;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserProfile(user.uid).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;
  if (loading) return <div>Cargando perfil...</div>;
  if (!profile) return <div>No se encontró el perfil.</div>;

  return (
    <div className="card p-3 mb-3" style={{ maxWidth: 400 }}>
      <div className="d-flex align-items-center gap-3">
        <img src={profile.photoURL} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%" }} />
        <div>
          <h5 className="mb-1">{profile.displayName || profile.githubUsername || profile.email}</h5>
          <div className="text-muted" style={{ fontSize: 14 }}>{profile.email}</div>
          {profile.githubUsername && (
            <div style={{ fontSize: 13 }}>
              <i className="bi bi-github"></i> <b>{profile.githubUsername}</b>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;
