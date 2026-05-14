/**
         * LOGIKA CORE & API (DIPERTAHANKAN 100%)
         */
         const firebaseConfig = {
    apiKey: "AIzaSyBoGzExHCZvLNnLHggB2sbst0t4l-tc3Mk",
    authDomain: "mods-31307.firebaseapp.com",
    projectId: "mods-31307",
    storageBucket: "mods-31307.appspot.com",
    messagingSenderId: "913890186204",
    appId: "1:913890186204:web:4a652535f0fba62bda7519"
};

firebase.initializeApp(firebaseConfig);
         
        const GROQ_API_KEY = "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";
        const GROQ_MODEL = "llama-3.1-8b-instant";
        let currentMode = "AI";
        const aiChatHistory = [];    // Penampung chat AI (RAM)
        const adminChatHistory = []; // Penampung chat Admin (Firebase)
        const heroHTML = document.getElementById('hero').outerHTML; // Simpan template hero

        const db = firebase.firestore();
        localStorage.removeItem("lumina_memory");
        let activeChatId = null;

async function createOrOpenSupportChat(userMessage) {
    try {
        let savedChatId = localStorage.getItem("support_chat_id");

        if(!savedChatId) {
            const roomRef = await db.collection("chats").add({
                userName: "User HiFin",
                lastMessage: userMessage,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            savedChatId = roomRef.id;
            localStorage.setItem("support_chat_id", savedChatId);
        }

        activeChatId = savedChatId;

        await db.collection("chats").doc(savedChatId).collection("messages").add({
            sender: "user",
            text: userMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("chats").doc(savedChatId).update({
            lastMessage: userMessage,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("notifications").add({
            type: "admin_chat",
            chatId: savedChatId,
            message: `Pesan baru dari user: ${userMessage}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(err) {
        console.error(err);
    }
}
    
        const chatMemory = [];
        const AI_PERSONA = `

`;

        // -- LOGIC FUNCTIONS --
        function compressConversation() {
            return chatMemory.slice(-3).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");
        }

        function getInstantReply(text) {
            const lower = text.toLowerCase().trim();
            const instantMap = {
                "hai": "Halo ðŸ‘‹. ada yang bisa ku bantu mengenai HiFin?",
                "halo": "Halo ðŸ‘‹. ada yang bisa ku bantu mengenai HiFin?",
                "wkwk": "ðŸ˜„ Saya senang suasana hati Anda sedang baik.",
                "makasih": "Sama-sama. Itu adalah tugas saya untuk memberikan hasil terbaik. ðŸ‘‹",
                "keren": "Terimakasih apresiasinya bungðŸ˜Š"
            };
            return instantMap[lower] || null;
        }

        function detectIntent(text) {
            const lower = text.toLowerCase();
            if (lower.includes("error") || lower.includes("bug")) return "debugging";
            if (lower.includes("buat") || lower.includes("generate")) return "generation";
            return "general";
        }

        function parseMarkdown(text) {
    if (!text) return "";

    // 1. Escape HTML dasar agar aman
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2. Render Markdown ke HTML
    html = html
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^\>\s(.*)$/gim, '<blockquote>$1</blockquote>')
        .replace(/^\s*[-*]\s(.*)$/gim, '<li>$1</li>');

    // 3. Gabungkan list item ke dalam <ul>
    html = html.replace(
    /(?:<li>.*?<\/li>\s*)+/gms,
    match => `<ul>${match}</ul>`
);

    // 4. Baris baru menjadi <br>
    html = html.replace(/\n/g, '<br>');

    return html;
}

        function buildPrompt(userText) {
            const intent = detectIntent(userText);
            const context = compressConversation();
            return `CONTEXT:\n${context}\n\nINTENT: ${intent}\n\nUSER: ${userText}`;
        }

        // -- UI DOM ELEMENTS --
        const scroller = document.getElementById('chat-scroller');
        const input = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const modeToggle = document.getElementById('modeToggle');
        const aiStatus = document.getElementById('ai-status');
        const statusText = document.getElementById('status-text');
        const hero = document.getElementById('hero');
        const adminHud = document.getElementById('admin-hud');

        // -- UI INTERACTIONS --
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        modeToggle.addEventListener('click', () => {
            currentMode = (currentMode === "AI") ? "ADMIN" : "AI";
            const brandName = document.getElementById('brandName');
            if (currentMode === "ADMIN") {
                brandName.innerHTML = "HiFin";
            } else {
                brandName.innerHTML = 'LUMINA<span>.AI</span>';
            }
            modeToggle.classList.toggle('admin-mode');
            document.getElementById('lblAi').classList.toggle('active-label');
            document.getElementById('lblAdmin').classList.toggle('active-label');
            adminHud.style.display = (currentMode === "ADMIN") ? 'block' : 'none';
            scroller.innerHTML = ""; 
            const history = (currentMode === "AI") ? aiChatHistory : adminChatHistory;
            if (history.length === 0) {
                scroller.innerHTML = heroHTML;
            } else {
                history.forEach(msg => renderToUI(msg.role, msg.text, msg.mode));
            }
            setTimeout(scrollToBottom, 50);
        });

        async function handleMessage() {
    const text = input.value.trim();
    if (!text) return;
    if (hero) hero.remove();
    appendMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    if (currentMode === "ADMIN") {
        await createOrOpenSupportChat(text);
        return;
    }
    const instant = getInstantReply(text);
    if (instant) {
        setTimeout(() => {
            appendMessage('ai', instant);
        }, 600);
        return;
    }
    await fetchAIResponse(text);
}

        function appendMessage(role, text) {
    const msgObj = { role, text, mode: currentMode };
    if (currentMode === "AI") aiChatHistory.push(msgObj);
    else adminChatHistory.push(msgObj);
    renderToUI(role, text, currentMode);
}

        function showStatus(msg) {
            statusText.textContent = msg;
            aiStatus.style.display = 'flex';
        }

        function hideStatus() {
            aiStatus.style.display = 'none';
        }

        async function fetchAIResponse(userText) {
    showStatus("AI IS THINKING...");

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: AI_PERSONA },
                    { role: "user", content: buildPrompt(userText) }
                ],
                temperature: 0.75,
                max_tokens: 1400
            })
        });

        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "System Alert: Neural link broken.";
        
        hideStatus();
        appendMessage('ai', aiText); // Hanya tampil di UI, tidak disimpan ke DB

    } catch (error) {
        hideStatus();
        appendMessage('ai', "Error: Gagal mengakses AI.");
    }
}
        
        // ✅ Selalu render pesan admin
function listenAdminReply() {
    if(!activeChatId) return;
    db.collection("chats")
    .doc(activeChatId)
    .collection("messages")
    .orderBy("timestamp")
    .onSnapshot((snap) => {
        snap.docChanges().forEach((change) => {
            if(change.type === "added") {
                const msg = change.doc.data();
                if(msg.sender === "admin") {
                    const exists = adminChatHistory.some(m => m.text === msg.text);
                    if(!exists) {
                        adminChatHistory.push({ role: 'ai', text: msg.text, mode: "ADMIN" });
                        renderToUI("ai", msg.text, "ADMIN"); // ← hapus kondisi if
                    }
                }
            }
        });
    });
}

        sendBtn.addEventListener('click', handleMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMessage();
            }
        });

        // Anti-Zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        
// Inisialisasi listener untuk balasan admin
const savedChatId = localStorage.getItem("support_chat_id");
if (savedChatId) {
    activeChatId = savedChatId;
    listenAdminReply();
}

        async function loadAdminHistory() {
            const savedChatId = localStorage.getItem("support_chat_id");
            if (!savedChatId) return;
            activeChatId = savedChatId;
            const snapshot = await db.collection("chats")
                .doc(activeChatId)
                .collection("messages")
                .orderBy("timestamp", "asc")
                .get();
            snapshot.forEach(doc => {
                const msg = doc.data();
                adminChatHistory.push({
                    role: msg.sender === 'user' ? 'user' : 'ai',
                    text: msg.text,
                    mode: "ADMIN"
                });
                if(currentMode === "ADMIN") {
                    const heroElement = document.getElementById('hero');
                    if(heroElement) heroElement.remove();
                    renderToUI(msg.sender === 'user' ? 'user' : 'ai', msg.text, "ADMIN");
                }
            });
            setTimeout(scrollToBottom, 20); 
            listenAdminReply();
        }

// Fungsi bantu untuk render tanpa menambah memori chat AI
function renderStaticMessage(role, text) {
    const group = document.createElement('div');
    group.className = `msg-group ${role === 'user' ? 'user-side' : 'ai-side'}`;
    const safeHtml = parseMarkdown(text);
    
    let displayName = role === 'user' ? 'USER' : 'Admin HiFin';

    group.innerHTML = `
        <div class="bubble-wrap">${safeHtml}</div>
        <div class="meta-info">
            <span>${displayName}</span>
            <span>//</span>
            <span>SAVED</span>
        </div>
    `;
    scroller.appendChild(group);
}

function scrollToBottom() {
    setTimeout(() => {
        scroller.scrollTo({
            top: scroller.scrollHeight + 500, // Tambah offset ekstra
            behavior: 'smooth'
        });
    }, 50);
}


const observer = new MutationObserver(() => {
    scrollToBottom();
});
observer.observe(scroller, {
    childList: true, 
    subtree: true 
});


function renderToUI(role, text, mode) {
    const group = document.createElement('div');
    group.className = `msg-group ${role === 'user' ? 'user-side' : 'ai-side'}`;
    
    let displayName = (role === 'user') ? "USER" : (mode === "ADMIN" ? "Admin HiFin" : "Lumina.AI");
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    group.innerHTML = `
        <div class="bubble-wrap">${parseMarkdown(text)}</div>
        <div class="meta-info">
            <span>${displayName}</span>
            <span>//</span>
            <span>${time}</span>
        </div>
    `;
    scroller.appendChild(group);
}

loadAdminHistory();
localStorage.removeItem("lumina_memory"); 
