import { useEffect } from "react";

/**
 * Hook lắng nghe 1 event Socket.IO
 * @param {Socket} socket - instance socket
 * @param {string} eventName - tên event
 * @param {(data: any) => void} callback - callback khi nhận event
 */
export const useSocketEvent = (socket, eventName, callback) => {
  useEffect(() => {
    if (!socket) return;

    // Đăng ký event
    socket.on(eventName, callback);

    // Cleanup khi component unmount hoặc event/socket thay đổi
    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
};
