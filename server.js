const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const os = require('os-utils');
const path = require('path');

// ตั้งค่า Port (สำคัญมากสำหรับการ Deploy บน Render/Heroku)
const PORT = process.env.PORT || 3000;

// บอก Server ให้ใช้ไฟล์ในโฟลเดอร์ 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route หลัก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket Connection
io.on('connection', (socket) => {
    console.log(`>> New Connection: ${socket.id}`);
    
    // ส่งข้อความต้อนรับ
    socket.emit('log-update', { type: 'sys', msg: 'Uplink established successfully.' });

    socket.on('disconnect', () => {
        console.log(`<< Disconnected: ${socket.id}`);
    });
});

// Loop ส่งข้อมูล System Stats (ทำงานทุก 1 วินาที)
setInterval(() => {
    os.cpuUsage(function(cpuPercent) {
        
        // คำนวณ RAM
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramPercent = (usedMem / totalMem) * 100;

        // ข้อมูลที่จะส่ง
        const stats = {
            cpu: (cpuPercent * 100).toFixed(1),
            ram: ramPercent.toFixed(1),
            uptime: os.sysUptime(),
            // จำลอง Traffic เน็ต (เพราะ Node.js เข้าถึง Network Card โดยตรงยากบน Cloud)
            netRx: (Math.random() * 5 + 2).toFixed(1),
            netTx: (Math.random() * 10 + 1).toFixed(1)
        };

        io.emit('system-stats', stats);
    });
}, 1000);

// เริ่มรัน Server
http.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 SYSTEM READY`);
    console.log(`📡 Listening on Port: ${PORT}`);
    console.log(`-----------------------------------------`);
});
