const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});
const path = require('path');

const PORT = process.env.PORT || 3000;

// สั่งให้ Server รู้จักไฟล์ HTML/CSS
app.use(express.static(__dirname));

// เมื่อมีคนเข้าเว็บ ให้ส่งไฟล์ index.html ไปโชว์
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ระบบห้องสื่อสาร
io.on('connection', socket => {
    console.log('New connection: ' + socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

server.listen(PORT, () => {
    console.log(`VN CMD SYSTEM READY ON PORT: ${PORT}`);
});
