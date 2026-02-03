const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});
const path = require('path');

// Port สำหรับรัน
const PORT = process.env.PORT || 3000;

// 1. บอก Server ว่าไฟล์เว็บ (html, css, รูป) อยู่ที่ไหน (โฟลเดอร์ปัจจุบัน)
app.use(express.static(__dirname));

// 2. ถ้ามีคนเข้าหน้าแรก (Root) ให้ส่งไฟล์ index.html ไปโชว์
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. ระบบห้องสื่อสาร (Socket Logic)
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        // console.log(`User ${userId} joined room ${roomId}`);
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
