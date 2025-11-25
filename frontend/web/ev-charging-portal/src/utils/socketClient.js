import { io } from "socket.io-client";


export const socketInit = (url, path) => {
    const socket = io(url, {
        path: path,
        transports: ["websocket"],
    })
    return socket;
}

export const connectSocket = (socket) => {
    if(!socket) {
        console.log("Socket doesn't init");
        return;
    }
    socket.off("connect")
    socket.on("connect", () => {
        console.log("Connected with ID:", socket.id);
    });
};

export const joinRoom = (socket, roomId) => {
    socket.emit('join', { roomId });
}

export const leaveRoom = (socket, roomId) => {
    socket.emit('leave', { roomId });
}

export const disconnectSocket = (socket) => {
  if (!socket) {
    console.error("Socket doesn't init.");
    return;
  }
  socket.disconnect();
  console.log("Socket is disconted.");
};