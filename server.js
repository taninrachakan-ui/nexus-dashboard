// server.js - VN GROUP CORE SYSTEM
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" } // อนุญาตให้ทุกที่เชื่อมต่อได้
});

app.use(express.static(__dirname)); // เสิร์ฟไฟล์ในโฟลเดอร์นี้

// --- STORAGE ---
let connectedUnits = new Map(); // เก็บข้อมูล User

io.on('connection', (socket) => {
    console.log(`[+] New Connection: ${socket.id}`);

    // 1. DATA SYSTEM: รับค่าสถานะ (CPU, IP, Status)
    socket.on('unit-update', (data) => {
        // data = { id: 'UNIT-01', ip: '...', cpu: 20 }
        connectedUnits.set(socket.id, data);
        
        // Broadcast บอก Dashboard ทุกตัว
        io.emit('update-dashboard', {
            users: Array.from(connectedUnits.values()), // ส่งรายการทั้งหมด
            count: connectedUnits.size,
            lastActivity: `UPDATE FROM ${data.id}`
        });
    });

    // 2. VOICE SYSTEM: รับเสียง -> กระจายเสียง (Relay)
    socket.on('voice-stream', (audioChunk) => {
        // รับก้อนเสียงจากต้นทาง ส่งให้ทุกคน (ยกเว้นคนพูด)
        socket.broadcast.emit('voice-receive', audioChunk);
    });

    // 3. DISCONNECT
    socket.on('disconnect', () => {
        if(connectedUnits.has(socket.id)){
            const unit = connectedUnits.get(socket.id);
            console.log(`[-] Unit Lost: ${unit.id}`);
            connectedUnits.delete(socket.id);
            
            io.emit('update-dashboard', {
                users: Array.from(connectedUnits.values()),
                count: connectedUnits.size,
                lastActivity: `CONNECTION LOST: ${unit.id}`
            });
        }
    });
});

// START SERVER
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
    =========================================
      VN GROUP OPERATING SYSTEM // ONLINE
      [STATUS]  : RUNNING
      [PORT]    : ${PORT}
      [ACCESS]  : http://localhost:${PORT}
    =========================================
    `);
});
