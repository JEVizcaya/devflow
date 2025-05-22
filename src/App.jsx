import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import './App.css'
import "./App.animations.css";
import "./theme-colors.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DarkModeProvider } from "./contex/DarkModeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CrearProyecto from "./pages/CrearProyecto";
import Toast from "./components/Toast";
import MisProyectos from "./pages/MisProyectos";
import ProyectoDetalle from "./pages/ProyectoDetalle";
import MisTareas from "./pages/MisTareas";
import ProyectosDisponibles from "./pages/ProyectosDisponibles";
import ProyectosPublicos from "./pages/ProyectosPublicos";
import { saveUserProfile } from "./firebase/firestore";

// Define ProtectedRoute component
const ProtectedRoute = ({ user, element, setToast }) => {
  if (user) {
    return element;
  } else {
    // Redirect to landing page with a query parameter to indicate authentication is required.
    // Also pass setToast to Landing page if needed for the message.
    return <Navigate to="/?authRequired=true" replace />;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        if (firebaseUser) {
          await saveUserProfile(firebaseUser);
        }
      });
      return unsubscribe;
    });
  }, []);

  if (loading) return <div className="container d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;

  // En handleLogout, forzar cierre de sesión y limpiar sesión
  const handleLogout = async () => {
    const auth = getAuth();
    await auth.signOut();
    setUser(null);
    setToast && setToast({ message: "Sesión cerrada", type: "success" });
    // navigate("/"); // As noted before, navigate is not defined here.
  };

  return (
    <DarkModeProvider>
      <Router>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing setToast={setToast} />} />
          <Route path="/dashboard" element={<ProtectedRoute user={user} element={<Dashboard setToast={setToast} />} setToast={setToast} />} />
          <Route path="/crear-proyecto" element={<ProtectedRoute user={user} element={<CrearProyecto setToast={setToast} />} setToast={setToast} />} />
          <Route path="/mis-proyectos" element={<ProtectedRoute user={user} element={<MisProyectos />} setToast={setToast} />} />
          <Route path="/proyecto/:ownerId/:projectId" element={<ProtectedRoute user={user} element={<ProyectoDetalle />} setToast={setToast} />} />
          <Route path="/mis-tareas" element={<ProtectedRoute user={user} element={<MisTareas />} setToast={setToast} />} />
          <Route path="/proyectos-disponibles" element={<ProtectedRoute user={user} element={<ProyectosDisponibles />} setToast={setToast} />} />
          <Route path="/proyectos-publicos" element={<ProtectedRoute user={user} element={<ProyectosPublicos />} setToast={setToast} />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App
