import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import socket, { joinUserRoom } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("fb_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [chatToast, setChatToast] = useState(null);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    joinUserRoom(userId);
    // socket.io may reconnect (network blip, tab wake) and drop room membership,
    // so re-join on every reconnect too.
    socket.on("connect", () => joinUserRoom(userId));
    return () => socket.off("connect");
  }, [user]);

  // Global "you got a chat message" alert. ChatPanel already handles messages
  // when a conversation is open; this covers every other screen, since the
  // app has no other notification surface for incoming chat activity.
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    const handler = ({ message }) => {
      const senderId = message?.sender?._id || message?.sender;
      if (!senderId || senderId === userId) return; // don't toast your own message
      setChatToast({
        name: message?.sender?.name || "New message",
        text: message?.text || "",
      });
      window.clearTimeout(handler._t);
      handler._t = window.setTimeout(() => setChatToast(null), 4000);
    };

    socket.on("chat_message", handler);
    return () => socket.off("chat_message", handler);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("fb_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("fb_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("fb_token");
        localStorage.removeItem("fb_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("fb_token", res.data.token);
    localStorage.setItem("fb_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("fb_token", res.data.token);
    localStorage.setItem("fb_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("fb_token");
    localStorage.removeItem("fb_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
      {chatToast && (
        <div
          onClick={() => setChatToast(null)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            maxWidth: "320px",
            background: "#0f172a",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>
            {chatToast.name}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.85 }}>{chatToast.text}</div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
