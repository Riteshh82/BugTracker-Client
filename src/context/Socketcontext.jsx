import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./Authcontext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    s.on("connect", () => {
      s.emit("join_room", user._id);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);