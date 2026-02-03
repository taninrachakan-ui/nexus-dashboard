const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // อนุญาตให้เชื่อมต่อจากทุกที่
        methods: ["GET", "POST"]
    }
});

// Port สำหรับรัน Server
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("VN CMD SERVER : ONLINE");
});

// เมื่อมีคนเชื่อมต่อเข้ามา
io.on('connection', socket => {
    
    // เมื่อคนนั้นขอเข้าห้อง (Join Room)
    socket.on('join-room', (roomId, userId, userName) => {
        console.log(`[JOIN] Room: ${roomId} | User: ${userId} (${userName})`);
        
        // พาเข้าห้อง
        socket.join(roomId);
        
        // บอกคนอื่นในห้องว่า "เห้ย มีเด็กใหม่มา!" (ส่ง userId ไปให้คนอื่นโทรหา)
        socket.to(roomId).emit('user-connected', userId, userName);

        // เมื่อคนนั้นหลุด/ออก
        socket.on('disconnect', () => {
            console.log(`[LEAVE] Room: ${roomId} | User: ${userId}`);
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

server.listen(PORT, () => {
    console.log(`>> SYSTEM READY ON PORT: ${PORT}`);
});
