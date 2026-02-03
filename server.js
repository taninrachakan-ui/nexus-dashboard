const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});
const path = require('path');

const PORT = process.env.PORT || 3000;

// เก็บข้อมูลผู้ใช้งานแบบ Real-time
let connectedUsers = {}; // เก็บรายการ user { socketId: roomId }
let totalUsers = 0;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', socket => {
    
    // เมื่อมีคน (ทั้งเว็บและแอป) เชื่อมต่อเข้ามา
    // เราจะยังไม่นับ จนกว่าเขาจะ Join Room
    
    // เมื่อ APP ส่งคำสั่ง Join Room มา
    socket.on('join-room', (roomId, userId) => {
        
        // 1. พาเข้าห้อง
        socket.join(roomId);
        
        // 2. บันทึกข้อมูล
        connectedUsers[socket.id] = roomId;
        totalUsers++;
        
        console.log(`[JOIN] Room: ${roomId} | User: ${userId}`);

        // 3. บอกคนอื่นในห้องว่า "มีคนมา ให้โทรไปหาเขาหน่อย" (เพื่อให้คุยกันได้)
        socket.to(roomId).emit('user-connected', userId);

        // 4. ส่งอัปเดตไปที่ "หน้าเว็บ Monitor" (Broadcast หาทุกคน)
        io.emit('update-stats', {
            count: totalUsers,
            lastAction: `UNIT ${userId.substr(0,4)} JOINED SQ-${roomId}`
        });
    });

    // เมื่อมีคนหลุด (ปิดแอป / เน็ตหลุด)
    socket.on('disconnect', () => {
        const roomId = connectedUsers[socket.id];
        if (roomId) {
            // ลบข้อมูล
            delete connectedUsers[socket.id];
            totalUsers = Math.max(0, totalUsers - 1); // กันเลขติดลบ

            // บอกคนในห้องให้วางสาย
            socket.to(roomId).emit('user-disconnected', socket.id); // *Note: PeerJS usually handles ID via stream close, but signal helps cleanup
            
            // อัปเดตหน้าเว็บ
            io.emit('update-stats', {
                count: totalUsers,
                lastAction: `UNIT DISCONNECTED`
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`SYSTEM OPERATIONAL ON PORT: ${PORT}`);
});
