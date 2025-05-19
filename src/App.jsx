import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import './App.css'
import "./App.animations.css";
import "./theme-colors.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DarkModeProvider } from "./contex/DarkModeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CrearProyecto from "./pages/CrearProyecto";
import Toast from "./components/Toast";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="container d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;

  return (
    <DarkModeProvider>
      <Router>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing setToast={setToast} />} />
          <Route path="/dashboard" element={user ? <Dashboard setToast={setToast} /> : <Navigate to="/" />} />
          <Route path="/crear-proyecto" element={user ? <CrearProyecto setToast={setToast} /> : <Navigate to="/" />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App
