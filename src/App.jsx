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
import { saveUserProfile } from "./firebase/firestore";

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
    navigate("/");
  };

  return (
    <DarkModeProvider>
      <Router>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing setToast={setToast} />} />
          <Route path="/dashboard" element={user ? <Dashboard setToast={setToast} /> : <Navigate to="/" />} />
          <Route path="/crear-proyecto" element={user ? <CrearProyecto setToast={setToast} /> : <Navigate to="/" />} />
          <Route path="/mis-proyectos" element={<MisProyectos />} />
          <Route path="/proyecto/:ownerId/:projectId" element={<ProyectoDetalle />} />
          <Route path="/mis-tareas" element={<MisTareas />} />
          <Route path="/proyectos-disponibles" element={<ProyectosDisponibles />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App
