// main.js - VN GROUP CLIENT LOGIC
const socket = io();

// --- CONFIG ---
const myID = "HQ-COMMANDER"; // หรือสุ่มเอาก็ได้
let isTalking = false;
let mediaRecorder;
let audioChunks = [];

// --- 1. CONNECTION & DATA HANDLING ---
socket.on('connect', () => {
    updateStatus(true);
    // ส่งข้อมูลตัวเองไปบอก Server ว่ากูอยู่นี่
    socket.emit('unit-update', { id: myID, ip: '192.168.1.100', cpu: 15, status: 'ONLINE' });
});

socket.on('disconnect', () => updateStatus(false));

// รับข้อมูลอัปเดตหน้าจอ (กราฟ + ตัวเลข + ตาราง)
socket.on('update-dashboard', (data) => {
    // 1. อัปเดตตัวเลข
    document.getElementById('user-count').innerText = data.count;
    
    // 2. อัปเดตตาราง Users
    renderUserTable(data.users);

    // 3. อัปเดต Logs เล็กๆ
    if(data.lastActivity) {
        document.getElementById('mini-log').innerText = `[SYS] ${data.lastActivity}`;
    }
});

// --- 2. VOICE SYSTEM (AUDIO) ---

// A. ฝั่งคนฟัง (RECEIVER)
socket.on('voice-receive', async (arrayBuffer) => {
    // แปลงข้อมูลที่ได้เป็นเสียงแล้วเล่นทันที
    const blob = new Blob([arrayBuffer], { type: 'audio/webm;codecs=opus' });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    // เล่นเสียง (อาจต้อง Interact กับหน้าเว็บก่อน 1 ครั้ง Browser ถึงยอมให้เล่น)
    try {
        await audio.play();
        showVoiceIndicator(true); // โชว์ไฟกระพริบว่ามีเสียงเข้า
        audio.onended = () => showVoiceIndicator(false);
    } catch (e) {
        console.error("Audio Play Error (Click page first):", e);
    }
});

// B. ฝั่งคนพูด (SENDER - Push to Talk)
// ผูกกับปุ่มไมค์ตรงกลาง (class="fab")
const micBtn = document.querySelector('.fab');

micBtn.addEventListener('mousedown', startRecording); // กดค้างเพื่อพูด (PC)
micBtn.addEventListener('mouseup', stopRecording);    // ปล่อยเพื่อส่ง
micBtn.addEventListener('touchstart', startRecording); // มือถือแตะ
micBtn.addEventListener('touchend', stopRecording);    // มือถือปล่อย

async function startRecording(e) {
    e.preventDefault();
    if(isTalking) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        isTalking = true;
        
        // UI Effect
        micBtn.style.transform = "scale(1.2)";
        micBtn.style.boxShadow = "0 0 30px #ff0f4d"; // สีแดงตอนพูด
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                // ส่งก้อนเสียงไป Server
                socket.emit('voice-stream', event.data);
            }
        };
        
        // ส่งทุกๆ 1000ms (1 วินาที) หรือจะส่งรวดเดียวตอนปล่อยก็ได้
        // ถ้าอยากได้ Realtime จัดๆ ให้ลดเหลือ 200-500
        mediaRecorder.start(500); 

    } catch (err) {
        console.error("Mic Error:", err);
        alert("กรุณาอนุญาตให้ใช้ไมโครโฟน!");
    }
}

function stopRecording(e) {
    if(e) e.preventDefault();
    if(!isTalking) return;
    
    mediaRecorder.stop();
    isTalking = false;
    
    // Reset UI
    micBtn.style.transform = "translateY(-25px)"; // กลับที่เดิม
    micBtn.style.boxShadow = "0 0 25px rgba(0, 243, 255, 0.4)"; // สีฟ้าเดิม
    
    // ปิดไมค์
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
}

// --- UTILITIES ---

function updateStatus(online) {
    const dot = document.getElementById('status-dot');
    if(online) {
        dot.classList.add('online');
        addLogSystem('CONNECTED TO VN SERVER');
    } else {
        dot.classList.remove('online');
        addLogSystem('CONNECTION LOST');
    }
}

function showVoiceIndicator(active) {
    // ฟังก์ชันทำให้ปุ่มไมค์กระพริบเวลาคนอื่นพูด
    const btn = document.querySelector('.fab');
    if(active) {
        btn.style.borderColor = "#00ff88"; // สีเขียวรับเสียง
        btn.style.animation = "pulse 0.5s infinite";
    } else {
        btn.style.borderColor = "var(--bg)";
        btn.style.animation = "none";
    }
}

function renderUserTable(users) {
    const container = document.getElementById('user-list-container');
    if(!users || users.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#555;">No Active Units</div>';
        return;
    }
    
    let html = '';
    users.forEach((u, index) => {
        html += `
        <div class="user-row">
            <div style="display:flex; align-items:center;">
                <div class="user-avatar" style="color:${u.status==='ONLINE'?'#00f3ff':'#666'}">
                    <i class="ri-user-3-fill"></i>
                </div>
                <div>
                    <div style="font-weight:600; color:white;">${u.id}</div>
                    <div style="font-size:11px; color:#666;">IP: ${u.ip}</div>
                </div>
            </div>
            <div style="font-size:10px; padding:2px 6px; border-radius:4px; 
                color:${u.status==='ONLINE'?'#00ff88':'#ff0f4d'}; 
                border:1px solid ${u.status==='ONLINE'?'#00ff88':'#ff0f4d'};">
                ${u.status}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function addLogSystem(msg) {
    const logContainer = document.getElementById('full-logs');
    if(logContainer) {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `<span>[SYS]</span> ${msg}`;
        logContainer.prepend(div);
    }
}
