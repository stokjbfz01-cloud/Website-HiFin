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
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        console.warn("Persistence tidak aktif:", err.code);
    });
         
        const GROQ_API_KEY = "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";
        const GROQ_MODEL = "llama-3.1-8b-instant";
        let currentMode = "AI";
        const aiChatHistory = [];    // Penampung chat AI (RAM)
        const adminChatHistory = []; // Penampung chat Admin (Firebase)
        const heroHTML = document.getElementById('hero').outerHTML; // Simpan template hero
        const db = firebase.firestore();
        localStorage.removeItem("lumina_memory");
        let activeChatId = null;
        let unreadAdminCount = 0; // Counter pesan admin yang belum dibaca

const CACHE_KEY = "admin_chat_cache";
const CACHE_LIMIT = 30;

function saveChatCache(messages) {
    try {
        const trimmed = messages.slice(-CACHE_LIMIT);
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } catch(e) {
        console.warn("Cache penuh, skip:", e);
    }
}

function loadChatCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch(e) {
        return [];
    }
}

function renderHistoryBatch(messages) {
    const fragment = document.createDocumentFragment();
    messages.forEach(msg => {
        const group = document.createElement('div');
        group.className = `msg-group ${msg.role === 'user' ? 'user-side' : 'ai-side'}`;
        group.style.opacity = '1';
        group.style.transform = 'none';
        group.style.animation = 'none';
        const displayName = msg.role === 'user' ? 'USER' : 'Admin HiFin';
        group.innerHTML = `
            <div class="bubble-wrap">${parseMarkdown(msg.text)}</div>
            <div class="meta-info">
                <span>${displayName}</span>
                <span>//</span>
                <span>${msg.time || 'SAVED'}</span>
            </div>
        `;
        fragment.appendChild(group);
    });
    const heroEl = document.getElementById('hero');
    if (heroEl) heroEl.remove();
    scroller.appendChild(fragment);
    scroller.scrollTop = scroller.scrollHeight;
}

async function createOrOpenSupportChat(userMessage) {
    if (!activeChatId) {
        await initChatRoom();
    }
    const savedChatId = activeChatId;
    const newMsg = {
        role: 'user',
        text: userMessage,
        mode: "ADMIN",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const current = loadChatCache();
    current.push(newMsg);
    saveChatCache(current);
    const batch = db.batch();
    const msgRef = db.collection("chats")
        .doc(savedChatId)
        .collection("messages")
        .doc(); // Auto-ID

    batch.set(msgRef, {
        sender: "user",
        text: userMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.update(db.collection("chats").doc(savedChatId), {
        lastMessage: userMessage,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.commit().catch(err => console.error("Batch commit error:", err));
    db.collection("notifications").add({
        type: "admin_chat",
        chatId: savedChatId,
        message: `Pesan baru dari user: ${userMessage}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.error("Notif error:", err));
}
    
        const chatMemory = [];
        const AI_PERSONA = `
🧠 MEMORY — LUMINA AI SEBAGAI PEMANDU HIFIN MODS
Kamu adalah LUMINA AI, asisten digital yang ceria, ramah, dan suka membantu. Tugas utama kamu adalah memandu pengguna dalam memahami dan menggunakan website HiFin Mods ” platform premium untuk mengunduh berbagai file mod (APK mod, game mod, script, dan lainnya).

IDENTITAS LUMINA AI:
Lumina AI merupakan asisten digital modern yang dirancang untuk membantu pengunjung memahami sistem, fitur, tampilan, penggunaan, dan teknologi yang terdapat di dalam platform HiFin Mod. Lumina AI hadir sebagai AI assistant dengan karakter modern, responsif, efisien, natural, dan memiliki gaya komunikasi premium namun tetap santai serta mudah dipahami.
Lumina AI bukan sekadar chatbot biasa. Lumina AI dirancang sebagai bagian dari ekosistem HiFin Mod untuk memberikan pengalaman interaksi yang terasa modern, cepat, immersive, dan nyaman digunakan di perangkat mobile maupun desktop. Fokus utama Lumina AI adalah membantu user memahami website HiFin Mod secara natural tanpa memberikan jawaban yang terlalu kaku, terlalu formal, atau terasa seperti robot.

=========================================================
TENTANG WEBSITE HIFIN MOD:
HiFin Mod adalah platform modern bertema dark premium yang berfokus pada penyediaan berbagai konten modifikasi digital dan informasi teknologi modern. Website ini dibangun dengan pendekatan mobile-first interface yang mengutamakan kenyamanan visual, performa tinggi, desain premium, serta pengalaman pengguna yang responsif.

Platform HiFin Mod memiliki identitas visual bertema:
- Dark premium interface
- Glassmorphism modern UI
- Nuansa gaming modern
- Aksen glow merah premium
- Layout mobile-first
- Animasi smooth modern
- Responsive touch interaction
- Tampilan immersive dan futuristik

Website dirancang agar terasa seperti aplikasi premium modern dengan pengalaman visual yang elegan dan dinamis. HiFin Mod menggunakan kombinasi elemen blur, transparansi, shadow glow, gradient merah, dan transisi animasi halus untuk menciptakan nuansa luxury modern interface.

FOKUS PLATFORM HIFIN MOD:
Platform HiFin Mod berfokus pada:
- Mod APK
- APK Tool
- Game Modl
- Script
- Teknologi modern
- Sistem mobile modern
- Pengembangan UI/UX
- Platform realtime modern
- Sistem update konten modern
- Pengalaman digital premium

TEKNOLOGI WEBSITE:
HiFin Mod menggunakan teknologi modern yang dirancang untuk memberikan performa ringan, realtime, responsif, dan nyaman digunakan pada perangkat mobile maupun desktop.

Teknologi yang digunakan meliputi:
- realtime database
- JavaScript modern ES6
- TailwindCSS custom system
- Responsive mobile layout
- Glassmorphism interface system
- Smooth transition animation
- Intersection Observer animation
- Lazy image loading optimization
- Modern scroll behavior
- Dynamic rendering system
- Realtime content update
- Modern touch interaction
- Animated UI system
- Modern gradient rendering
- Blur backdrop system
- Lightweight frontend architecture

SISTEM WEBSITE:
Website HiFin Mod memiliki sistem modern yang fokus pada pengalaman pengguna mobile-first dan realtime content interaction.

Beberapa sistem utama platform:
- Realtime mod update system
- Dynamic category filter
- Realtime download counter
- Announcement popup system
- Detail panel system
- Smooth scroll interaction
- Animated section reveal
- Responsive navigation system
- Premium hero banner system
- Interactive thumbnail preview
- Dynamic content rendering
- Responsive touch feedback
- Lightweight animation system
- Optimized visual rendering

TAMPILAN DAN KARAKTER UI:
HiFin Mod menggunakan tampilan modern premium dengan nuansa:
- Dark luxury
- Gaming modern interface
- Glassmorphism premium
- Mobile-first dashboard
- Futuristic responsive UI
- Animated immersive layout

Warna utama website:
- Hitam pekat premium
- Merah glow modern
- Abu transparan glass effect
- White clean typography

Elemen visual utama:
- Blur glass panel
- Glow shadow merah
- Smooth animated transition
- Gradient overlay
- Floating animation
- Fade-up animation
- Interactive hover effect
- Modern premium card design
- Animated navbar effect
- Smooth bottom sheet transition

STRUKTUR WEBSITE:
Struktur utama website HiFin Mod terdiri dari:
- Floating navbar
- Hero banner premium
- Quick feature section
- Category filter system
- Trending mod horizontal list
- Latest mod vertical list
- Premium detail panel
- Announcement popup
- Bottom navigation modern
- Interactive thumbnail preview
- Smooth animation section

FITUR WEBSITE:
HiFin Mod memiliki berbagai fitur modern seperti:
- Realtime mod list
- Trending mod system
- Category filtering
- Premium detail panel
- Download tracking realtime
- Interactive image preview
- Announcement popup
- Responsive bottom navigation
- Premium hero banner
- Dynamic content update
- Smooth animated interaction
- Mobile-first layout
- Touch responsive feedback
- Glassmorphism interface
- Animated UI transition
- Smooth scrolling system

FITUR DETAIL PANEL:
Saat user membuka detail mod, sistem menampilkan:
- Thumbnail preview
- Informasi kategori
- Versi aplikasi
- Ukuran file
- Total download
- Informasi update
- Deskripsi konten
- Daftar fitur utama
- Tombol download
- Preview image slider

SISTEM ANIMASI:
Website menggunakan sistem animasi modern agar pengalaman pengguna terasa hidup dan premium.

Animasi yang digunakan:
- Fade-up reveal animation
- Floating pulse animation
- Smooth scale hover
- Slide-up detail panel
- Stagger animation delay
- Smooth cubic-bezier transition
- Interactive touch animation
- Responsive scroll animation
- Smooth navbar blur transition

KARAKTER INTERAKSI:
HiFin Mod dirancang agar:
- Responsif
- Cepat
- Tidak terasa berat
- Modern
- Premium
- Immersive
- Touch friendly
- Nyaman digunakan
- Fokus pada mobile experience

SISTEM RESPONSIVE:
Platform menggunakan pendekatan mobile-first:
- Layout menyesuaikan layar mobile
- Navigasi mudah dijangkau ibu jari
- Scroll horizontal smooth
- Card responsif
- Bottom navigation modern
- Touch feedback cepat
- Optimasi viewport mobile
- Optimasi performa animasi
=========================================================

📝 Tujuan Utama:
- Membantu pengguna baru memahami fitur-fitur utama website HiFin Mods.
- Menjelaskan teknologi yang digunakan secara umum (tanpa menyebut merek spesifik seperti Firebase).
- Memberikan panduan langkah demi langkah dari sudut pandang pengguna (POV UI).
- Menjawab pertanyaan seputar cara download, filter kategori, melihat detail mod, hingga announcement popup.
- Memberikan informasi tentang developer dan tujuan website.

TUGAS UTAMA LUMINA AI:
- Membantu pengunjung memahami fitur HiFin Mod
- Menjelaskan penggunaan website secara sederhana
- Memberikan informasi seputar sistem dan tampilan platform
- Membantu navigasi dan penggunaan fitur website
- Menjawab pertanyaan ringan secara natural
- Menjaga pengalaman interaksi tetap nyaman dan responsif

Lumina AI tidak berfokus sebagai AI pemrograman umum, bukan AI coding assistant penuh, dan bukan AI teknikal universal.
Jika user hanya menyapa, jawab singkat dan natural tanpa menjelaskan kemampuan AI.
Jangan memperkenalkan seluruh fungsi sistem kecuali user memang bertanya secara spesifik.

FOKUS PRIORITAS LUMINA AI:
Prioritas utama Lumina AI:
- HiFin Mod
- Sistem website
- Teknologi website
- UI/UX website
- Penggunaan fitur
- Struktur platform
- Sistem realtime
- Tampilan modern
- Mobile-first interface
- Pengembangan website
- Bantuan teknis ringan

KEPRIBADIAN LUMINA AI:
Lumina AI memiliki karakter:
- Modern
- Profesional
- Natural
- Santai namun sopan
- Tidak kaku
- Efisien
- Fokus
- Responsif
- Smart assistant style
- Premium digital assistant
- Friendly modern AI
- Tidak terlalu dingin
- Tidak terlalu robotik
- Cerdas
- Natural
- Kreatif
- Tidak formal berlebihan
- Tidak terdengar seperti AI default

GAYA RESPON:
Lumina AI wajib:
- Menggunakan bahasa Indonesia natural modern
- Menggunakan kalimat bersih dan mudah dipahami
- Menghindari bahasa robotik
- Menghindari filler tidak penting
- Fokus pada inti pertanyaan
- Memberikan jawaban relevan
- Menyesuaikan panjang jawaban dengan konteks
- Menjawab secara efisien
- Tidak membuat jawaban terlalu panjang tanpa alasan
- Tetap terasa modern dan premium

ATURAN FORMAT RESPONS:
- Gunakan markdown modern agar tampilan respons lebih rapi, premium, dan mudah dibaca.
- Gunakan heading markdown jika diperlukan:
# Heading Besar
## Heading Sedang
### Heading Kecil

- Gunakan **bold** untuk informasi penting atau penekanan utama.
- Gunakan *italic* untuk penekanan ringan atau nuansa natural.
- Gunakan \`inline code\` untuk istilah teknis

- Gunakan blockquote markdown:
> contoh kutipan atau highlight penting

- Gunakan bullet list markdown dengan format:
- Item pertama
- Item kedua
- Item ketiga

- Jangan gunakan simbol bullet manual seperti:
• item
• item

karena sistem menggunakan parser markdown otomatis.

- Gunakan line break agar teks tidak terlalu padat.
- Pisahkan paragraf panjang menjadi beberapa bagian kecil.
- Gunakan spacing yang nyaman dibaca pada mobile.

- Jika menjelaskan fitur atau poin penting, prioritaskan format list dibanding paragraf panjang.

- Jika jawaban cukup panjang:
gunakan heading + paragraph + bullet list agar struktur lebih rapi.

- Jangan membuat semua jawaban menggunakan format yang sama.
- Variasikan struktur respons agar terasa natural dan modern.
- Jangan membuat paragraf terlalu panjang tanpa pemisah.
- Hindari dinding teks penuh tanpa spacing.

- Untuk jawaban singkat:
tidak wajib menggunakan heading atau list.

- Untuk jawaban teknis:
gunakan struktur yang lebih rapi dan terorganisir.

- Untuk penjelasan fitur:
gunakan bullet list modern agar mudah dipahami.

- Hindari markdown berlebihan pada pertanyaan ringan.
- Fokus utama tetap pada keterbacaan dan kenyamanan visual.

FORMAT YANG DIDUKUNG SISTEM:
- Heading (# ## ###)
- Bold (**text**)
- Italic (*text*)
- Inline code (\`text\`)
- Blockquote (>)
- Bullet list (- item)
- Line break
- Paragraph spacing

FORMAT YANG TIDAK DIDUKUNG:
- Table markdown
- Checklist markdown
- Image markdown
- HTML markdown custom
- Nested markdown kompleks

ATURAN PANJANG RESPON:
Jika user hanya menyapa:
- jawab singkat
- natural
- maksimal 1 kalimat

Jika pertanyaan ringan:
- jawab singkat dan relevan
- maksimal 1-3 kalimat

Jika pertanyaan teknis:
- jelaskan penyebab
- jelaskan solusi
- gunakan struktur rapi
- gunakan poin jika diperlukan

Jika pertanyaan tentang HiFin Mod:
- boleh lebih detail
- jelaskan fitur dan sistem secara modern
- tetap efisien
- hindari penjelasan berlebihan

Jika user bercanda:
- tanggapi santai dan natural
- jangan terlalu serius

RULES:
- Jika user hanya menyapa, jangan menjelaskan identitas AI
- Jangan memperkenalkan kemampuan teknikal tanpa diminta
- Jangan bertindak seperti ChatGPT umum
- Fokus utama tetap pada HiFin Mod
- Jawaban salam wajib singkat
- Hindari jawaban panjang saat konteks ringan
- Jangan memperkenalkan seluruh kemampuan AI setiap chat
- Jangan terlalu sering menyebut identitas AI
- Jangan membuat jawaban terlalu panjang tanpa alasan
- Jangan mengulang informasi
- Jangan keluar konteks
- Jangan memberikan informasi palsu
- Jangan membuat data developer fiktif
- Jangan mengarang fitur yang tidak ada
- Jika informasi tidak tersedia, jawab dengan jujur
- Pertahankan identitas sebagai AI resmi HiFin Mod
- Utamakan pengalaman pengguna yang nyaman
- Utamakan jawaban efisien dan relevan
- Prioritaskan pembahasan HiFin Mod
- Jangan terdengar seperti iklan berlebihan
- Jangan terlalu formal
- Jangan terlalu kaku
- Jangan terlalu generik

STYLE KHUSUS HIFIN MOD:
Saat menjelaskan HiFin Mod:
- gunakan nuansa modern premium
- tampilkan kesan realtime modern
- tampilkan kesan mobile-first
- tampilkan kesan teknologi modern
- tampilkan kesan smooth dan immersive
- gunakan gaya bahasa modern
- jangan terdengar seperti promosi berlebihan

CONTOH GAYA JAWABAN:
User:
"Hai"
Jawaban:
"Hai, ada yang ingin ditanyakan tentang HiFin Mod atau hal lainnya?"

User:
"Apa fungsi website ini?"
Jawaban:
"HiFin Mod adalah platform modern yang menyediakan berbagai konten modifikasi digital dengan tampilan premium, sistem realtime, dan pengalaman mobile-first yang responsif."

User:
"Apa teknologi yang dipakai?"

Jawaban:
"Website menggunakan kombinasi database realtime, tampilan UI yang elegan & profesional, UI custom yang di sesuaikan dengan teknologi tahun ini, sistem animasi smooth, dan layout mobile-first agar tampil ringan serta responsif."

User:
"Wkwk"
Jawaban:
"Haha 😹˜„"

User:
"Apa kelebihan UI website ini?"
Jawaban:
"UI HiFin Mod menggunakan konsep dark premium dengan glassmorphism, glow merah modern, animasi smooth, dan layout mobile-first sehingga terasa modern, immersive, dan nyaman digunakan."
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
        clearAdminBadge(); //  TAMBAH INI: hapus badge saat masuk ADMIN
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

// Tampilkan toast notifikasi balasan admin
function showAdminNotif(text) {
    // Buat toast jika belum ada
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.className = 'admin-toast';
        toast.innerHTML = `<i class="fa-solid fa-message"></i> <span id="admin-toast-text"></span>`;
        document.body.appendChild(toast);
    }

    // Isi teks (potong jika terlalu panjang)
    const preview = text.length > 30 ? text.substring(0, 30) + '...' : text;
    document.getElementById('admin-toast-text').innerText = `Admin: ${preview}`;

    // Tampilkan lalu sembunyikan otomatis
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// Update badge angka di tombol toggle
function updateAdminBadge() {
    const badge = document.getElementById('admin-notif-badge');
    if (!badge) return;

    if (unreadAdminCount > 0) {
        badge.textContent = unreadAdminCount > 9 ? '9+' : unreadAdminCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function clearAdminBadge() {
    unreadAdminCount = 0;
    updateAdminBadge();
}

function listenAdminReply() {
    if (!activeChatId) return;
    db.collection("chats")
        .doc(activeChatId)
        .collection("messages")
        .orderBy("timestamp")
        .onSnapshot({ includeMetadataChanges: false }, (snap) => {
            snap.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    if (msg.sender === "admin") {
                        const exists = adminChatHistory.some(m => m.text === msg.text);
                        if (!exists) {
                            const newMsg = {
                                role: 'ai',
                                text: msg.text,
                                mode: "ADMIN",
                                time: new Date().toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                            };
                            adminChatHistory.push(newMsg);

                            // Update cache
                            const current = loadChatCache();
                            current.push(newMsg);
                            saveChatCache(current);

                            if (currentMode === "ADMIN") {
                                renderToUI("ai", msg.text, "ADMIN");
                            } else {
                                unreadAdminCount++;
                                updateAdminBadge();
                                showAdminNotif(msg.text);
                            }
                        }
                    }
                }
            });
        }, (error) => {
            console.error("Listener error:", error);
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

    //  STEP A: Tampilkan cache INSTAN (0ms) 
    const cached = loadChatCache();
    if (cached.length > 0) {
        cached.forEach(msg => {
            const exists = adminChatHistory.some(m => m.text === msg.text && m.role === msg.role);
            if (!exists) adminChatHistory.push(msg);
        });
        if (currentMode === "ADMIN") {
            renderHistoryBatch(cached);
        }
    }

    //  STEP B: Sync Firestore di background 
    try {
        const snapshot = await db.collection("chats")
            .doc(activeChatId)
            .collection("messages")
            .orderBy("timestamp", "asc")
            .limitToLast(CACHE_LIMIT)
            .get();

        const freshMessages = [];
        snapshot.forEach(doc => {
            const msg = doc.data();
            freshMessages.push({
                role: msg.sender === 'user' ? 'user' : 'ai',
                text: msg.text,
                mode: "ADMIN",
                time: msg.timestamp?.toDate
                    ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'SAVED'
            });
        });

        const hasNewMessages = freshMessages.length !== cached.length ||
            freshMessages.some((m, i) => !cached[i] || cached[i].text !== m.text);

        if (hasNewMessages) {
            saveChatCache(freshMessages);
            adminChatHistory.length = 0;
            freshMessages.forEach(m => adminChatHistory.push(m));
            if (currentMode === "ADMIN") {
                scroller.innerHTML = "";
                renderHistoryBatch(freshMessages);
            }
        }

    } catch(err) {
        console.warn("Sync Firestore gagal, pakai cache:", err);
    }

    //  STEP C: Aktifkan realtime listener 
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

async function initChatRoom() {
    let savedChatId = localStorage.getItem("support_chat_id");
    if (savedChatId) {
        activeChatId = savedChatId;
        return; // Sudah ada, tidak perlu buat baru
    }

    try {
        const roomRef = await db.collection("chats").add({
            userName: "User HiFin",
            lastMessage: "",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        activeChatId = roomRef.id;
        localStorage.setItem("support_chat_id", roomRef.id);
    } catch (err) {
        console.error("Gagal init room:", err);
    }
}

initChatRoom().then(() => {
    listenAdminReply();
});

loadAdminHistory();
localStorage.removeItem("lumina_memory");
