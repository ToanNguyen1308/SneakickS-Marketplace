import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as notifApi from "../api/notifications";
import socket, { authenticateSocket } from "../realtime/socket";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnread(0);
      return;
    }
    setLoading(true);
    notifApi
      .listNotifications({ limit: 20 })
      .then(({ data }) => {
        setItems(data.data || []);
        setUnread(data.unread || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Load lan dau + khi login/logout.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cap nhat room socket theo token (login giua chung phien).
  useEffect(() => {
    authenticateSocket(token);
  }, [token]);

  // Nghe thong bao real-time.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onNew = (payload) => {
      const n = payload?.notification;
      if (!n) return;
      setItems((list) => [n, ...list].slice(0, 50));
      setUnread((c) => c + 1);
      toast.info(n.message);
    };
    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [isAuthenticated, toast]);

  const markRead = useCallback(async (id) => {
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
    try {
      await notifApi.markRead(id);
    } catch {
      /* best-effort */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await notifApi.markAllRead();
    } catch {
      /* best-effort */
    }
  }, []);

  const value = { items, unread, loading, refresh, markRead, markAllRead };
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
