import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Importar useNavigate
import { useDarkMode } from '../contex/DarkModeContext';
import NavBar from '../components/NavBar';
import { getUserProfile } from '../firebase/firestore'; // Función para obtener datos de Firestore
import { logout } from '../firebase/auth'; // Importar logout

const UserProfilePage = ({ setToast }) => { // Añadir setToast como prop
  const { userId } = useParams(); // Obtener el userId de la URL
  const navigate = useNavigate(); // Hook para navegación
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();

  // Definir handleLogout
  const handleLogout = async () => {
    await logout();
    // Idealmente, aquí también llamarías a setToast si lo tienes configurado en App.jsx y lo pasas como prop
    // Ejemplo: setToast && setToast({ message: "Sesión cerrada", type: "success" });
    navigate("/");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("UserProfilePage - userId from URL:", userId); // Log userId
      if (!userId) {
        setError('User ID no proporcionado en la URL.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getUserProfile(userId);
        console.log("UserProfilePage - Data from getUserProfile:", data); // Log data
        if (data) {
          setProfileData(data);
        } else {
          setError('Perfil no encontrado en Firestore.');
          setProfileData(null); // Asegurarse que no hay datos de perfil antiguos
        }
      } catch (err) {
        console.error("UserProfilePage - Error fetching user profile:", err); // Log error
        setError(`Error al cargar el perfil: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // New page wrapper style
  const pageWrapperStyle = {
    backgroundColor: darkMode ? '#1a1a1a' : '#f0f2f5',
    color: darkMode ? '#e0e0e0' : '#333',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  // Adapted style for the content area below NavBar
  const contentAreaStyle = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Centers the card within this area
    width: '100%',      // Ensures this area uses the width provided by pageWrapperStyle
    flexGrow: 1,        // Allows this area to fill remaining vertical space
  };

  const cardStyle = {
    backgroundColor: darkMode ? '#2c2c2c' : '#ffffff',
    color: darkMode ? '#e0e0e0' : '#333',
    borderRadius: '12px',
    boxShadow: darkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.1)',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    position: 'relative', // Añadir posición relativa para el botón de cierre
  };

  const avatarStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: darkMode ? '3px solid #0dcaf0' : '3px solid #0d6efd',
    marginBottom: '20px',
  };

  if (loading) {
    return (
      <div style={pageWrapperStyle}> {/* Apply page wrapper */}
        <NavBar onLogout={handleLogout} />
        <div style={contentAreaStyle} className="d-flex justify-content-center align-items-center"> {/* Use contentAreaStyle and ensure spinner is centered */}
          <div className={darkMode ? "spinner-border text-info" : "spinner-border text-primary"} role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrapperStyle}> {/* Apply page wrapper */}
        <NavBar onLogout={handleLogout} />
        <div style={contentAreaStyle} className="container text-center py-5"> {/* Use contentAreaStyle */}
          <h2 className="mb-3">Error</h2>
          <p className="lead">{error}</p>
          {userId && <p>Intentando cargar perfil para ID: {userId}</p>}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={pageWrapperStyle}> {/* Apply page wrapper */}
        <NavBar onLogout={handleLogout} />
        <div style={contentAreaStyle} className="container text-center py-5"> {/* Use contentAreaStyle */}
          <h2 className="mb-3">Perfil no encontrado</h2>
          <p className="lead">No se pudo encontrar información para el usuario especificado.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}> {/* Apply page wrapper */}
      <NavBar onLogout={handleLogout} />
      <div style={contentAreaStyle}> {/* Use contentAreaStyle for the card's container */}
        <div style={cardStyle}>
          <button 
            onClick={() => navigate(-1)} 
            style={{
              position: 'absolute',
              top: '-10px', // Mantener el ajuste vertical
              right: '-20px', // Mover más a la derecha
              background: 'transparent',
              border: 'none',
              fontSize: '2.5rem', // Aumentado de 1.5rem a 2.5rem
              cursor: 'pointer',
              color: darkMode ? '#aaa' : '#555',
              lineHeight: '1', // Para mejor alineación vertical de la X
            }}
            aria-label="Cerrar"
          >
            &times; {/* Símbolo de X */}
          </button>
          <img 
            src={profileData.photoURL || 'https://via.placeholder.com/120?text=No+Avatar'} 
            alt={profileData.displayName || 'Usuario'} 
            style={avatarStyle} 
          />
          <h1>{profileData.displayName || 'Usuario'}</h1>
          {profileData.githubUsername && (
            <p className="lead" style={{color: darkMode ? '#aaa' : '#6c757d'}}>
              <i className="bi bi-github me-2"></i>
              {profileData.githubUsername}
            </p>
          )}
          {profileData.email && (
            <p style={{fontSize: '1.1rem'}}>
              <i className="bi bi-envelope-fill me-2"></i>
              {profileData.email}
            </p>
          )}
          {/* Puedes añadir más información del perfil aquí si está disponible en Firestore */}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
