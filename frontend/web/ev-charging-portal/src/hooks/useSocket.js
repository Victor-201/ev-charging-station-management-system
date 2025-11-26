import { useEffect, useRef } from "react";
import { socketInit, connectSocket } from "../utils/socketClient";

export const useSocketClient = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Tạo socket chỉ 1 lần khi mount
    if (!socketRef.current) {
      const socket = socketInit("http://localhost:8000", "/socket.io");
      connectSocket(socket);
      socketRef.current = socket;
    }

    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};