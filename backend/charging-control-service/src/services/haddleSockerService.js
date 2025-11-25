import { io } from '../app.js';

io.on('connection', async(socket) => {
    console.log("A user connected.", socket.id);

    socket.on('join', async ({roomId}) => {
        socket.join(roomId.toString());
    });

    socket.on('leave', async ({roomId}) => {
        socket.leave(roomId.toString());
    })

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    })
})