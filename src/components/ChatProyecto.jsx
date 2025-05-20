import React, { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import { addChatMessage } from "../firebase/firestore";
import { useDarkMode } from "../contex/DarkModeContext";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";

const ChatProyecto = ({ ownerId, projectId, collaborators, onClose, sidebar }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const user = getAuth().currentUser;
  const { darkMode } = useDarkMode();
  const chatRef = useRef();

  useEffect(() => {
    setLoading(true);
    const db = getFirestore();
    const chatCol = collection(db, "users", ownerId, "projects", projectId, "chat");
    const q = query(chatCol, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [ownerId, projectId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    await addChatMessage(ownerId, projectId, {
      text: input,
      uid: user.uid,
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || "",
    });
    setInput("");
    setSending(false);
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 200);
  };

  // Sidebar style
  if (sidebar) {
    return (
      <div
        className={
          (darkMode ? "bg-dark text-light border-info" : "bg-white text-dark border-primary") +
          " card shadow-lg h-100 d-flex flex-column"
        }
        style={{ minHeight: 400, maxHeight: 600, width: "100%", position: "relative" }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h5 className="mb-0"><i className="bi bi-chat-dots me-2"></i>Chat del proyecto</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="flex-grow-1 overflow-auto p-2" style={{height: 350}} ref={chatRef}>
          {loading ? (
            <div className="text-center py-4">Cargando mensajes...</div>
          ) : (
            <div className="p-1">
              {messages.length === 0 && <div className="text-muted">No hay mensajes aún.</div>}
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={"d-flex mb-2 " + (msg.uid === user.uid ? "justify-content-end" : "justify-content-start") }>
                  <div className={msg.uid === user.uid ? "bg-info text-dark rounded-3 px-3 py-2" : "bg-secondary text-light rounded-3 px-3 py-2"} style={{maxWidth: 320}}>
                    <div className="d-flex align-items-center mb-1" style={{fontSize: 13}}>
                      {msg.photoURL && <img src={msg.photoURL} alt="avatar" style={{width: 24, height: 24, borderRadius: '50%', marginRight: 6}} />}
                      <b>{msg.displayName || "Usuario"}</b>
                    </div>
                    <div style={{fontSize: 15}}>{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="d-flex gap-2 align-items-center p-3 border-top" style={{background: darkMode ? '#232526' : '#f8fafc'}}>
          <input type="text" className="form-control" placeholder="Escribe un mensaje..." value={input} onChange={e => setInput(e.target.value)} disabled={sending} />
          <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()}><i className="bi bi-send"></i> Enviar</button>
        </form>
      </div>
    );
  }

  // ...existing modal code (if needed elsewhere)...
  return null;
};

export default ChatProyecto;
