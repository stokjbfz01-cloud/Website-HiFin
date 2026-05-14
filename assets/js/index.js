const firebaseConfig = {
    apiKey: "AIzaSyBoGzExHCZvLNnLHggB2sbst0t4l-tc3Mk",
    authDomain: "mods-31307.firebaseapp.com",
    projectId: "mods-31307",
    storageBucket: "mods-31307.appspot.com",
    messagingSenderId: "913890186204",
    appId: "1:913890186204:web:4a652535f0fba62bda7519"
};

// Inisialisasi
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
console.log("Firebase Connected Successfully");

        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Poppins', 'sans-serif'],
                    },
                    colors: {
                        dark: {
                            900: '#050505', // Deepest flagship black
                            800: '#09090b', // Ambient dark layer
                            700: '#121216', // Dark card
                            600: '#1c1c22'  // Elevated state
                        },
                        brand: {
                            red: '#e52525',
                            glow: '#ff4b4b',
                            dark: '#8a1010'
                        }
                    },
                    boxShadow: {
                        'glow-red': '0 0 25px rgba(229, 37, 37, 0.25)',
                        'glow-red-strong': '0 0 40px rgba(229, 37, 37, 0.4)',
                        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
                        'inner-light': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
                    },
                    transitionTimingFunction: {
                        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                        'bounce-smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }
                }
            }
        }

function closeAnnouncementPopup() {
    document
        .getElementById('announcement-popup')
        .classList.add('hidden');
}

db.collection('announcements')
.doc('main')
.onSnapshot((doc) => {
    if (!doc.exists) return;
    const data = doc.data();
    const modal =
        document.getElementById('announcementModal');
    const titleEl =
        modal.querySelector('h2');
    const textEl =
        modal.querySelector('p');
    const buttonEl =
        document.getElementById('announcementButton');
    // ================= ACTIVE CHECK =================
    if (!data.active) {
        modal.classList.add('hidden');
        return;
    }
    // ================= TITLE =================
    titleEl.innerText =
        data.title && data.title.trim() !== ""
            ? data.title
            : "Announcement";
    // ================= DESCRIPTION =================
    titleEl.innerText = data.title && data.title.trim() !== "" 
                        ? data.title 
                        : "Announcement"; // Ini judul default jika judul di admin kosong
    textEl.innerText = data.text && data.text.trim() !== "" 
                       ? data.text 
                       : "Selamat datang";
    if (data.link && data.link.trim() !== "") {
        buttonEl.classList.remove('hidden');
        buttonEl.onclick = () => {
            window.open(
                data.link,
                '_blank'
            );
        };
    } else {
        buttonEl.classList.add('hidden');
        buttonEl.onclick = null;
    }
    modal.classList.remove('hidden');
});

// Navbar Scroll Effect Premium Upgrade
const homeScreen = document.getElementById('homeScreen');
const navbarBg = document.getElementById('navbar-bg');

homeScreen.addEventListener('scroll', () => {
    if (homeScreen.scrollTop > 30) {
        navbarBg.classList.add('bg-dark-900/80', 'backdrop-blur-xl', 'border-white/10', 'shadow-[0_10px_30px_rgba(0,0,0,0.8)]');
        navbarBg.classList.remove('bg-dark-900/0', 'backdrop-blur-none', 'border-transparent');
    } else {
        navbarBg.classList.remove('bg-dark-900/80', 'backdrop-blur-xl', 'border-white/10', 'shadow-[0_10px_30px_rgba(0,0,0,0.8)]');
        navbarBg.classList.add('bg-dark-900/0', 'backdrop-blur-none', 'border-transparent');
    }
});

let mods = [];

// ================= RENDER TRENDING (UI UPGRADED) =================
function renderTrending(data) {
    const container = document.getElementById("trendingList");
    container.innerHTML = "";
    
    // Karena data dari loadModsRealtime sudah di-order by "updatedAt" desc,
    // Kita langsung ambil 10 data terbaru saja (tanpa sort download).
    const topLatest = data.slice(0, 10);

    topLatest.forEach((mod, index) => {
    setTimeout(() => {
        const img = mod.images?.[0] || 'https://placehold.co/300';
        const card = document.createElement("div");
        // Inject Premium Classes
        card.className = "mod-card shrink-0 w-[160px] glass-panel rounded-[24px] overflow-hidden relative group cursor-pointer transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-brand-red/30 hover:shadow-glow-red border border-white/5";
        card.onclick = () => openDetail(mod.id);
        
        card.innerHTML = `
            <div class="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md text-brand-glow text-[8px] font-bold px-2 py-1.5 rounded-md uppercase tracking-wider border border-white/10 shadow-glass flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-glow animate-pulse"></span>
                ${mod.category || "UNKNOWN"}
            </div>
            
            <div class="h-[170px] w-full relative overflow-hidden">
                <img 
    src="${img}" 
    loading="lazy" 
    decoding="async" 
    fetchpriority="low" 
    class="w-full h-full object-cover transform transition duration-[800ms] ease-out group-hover:scale-110 group-hover:rotate-1"
>
                <div class="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/40 to-transparent"></div>
                <div class="absolute inset-0 bg-brand-red/0 group-hover:bg-brand-red/10 transition duration-500"></div>
            </div>
            
            <div class="p-4 relative z-10 -mt-10">
                <h4 class="font-display font-bold text-[13px] text-white mb-2 line-clamp-2 drop-shadow-md leading-tight group-hover:text-brand-glow transition-colors">${mod.title}</h4>
                <div class="flex items-center justify-between mt-3">
                    <span class="text-[10px] text-gray-300 font-semibold bg-dark-900/80 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5 shadow-inner-light">
    <i class="fa-solid fa-download text-brand-glow text-xs"></i> ${formatK(mod.downloads || 0)}
</span>
                    <span class="text-[9px] font-bold text-white bg-brand-dark px-1.5 py-1 rounded-md border border-brand-red/30">${mod.version || 'v1.0'}</span>
                </div>                
            </div>
        `;
        container.appendChild(card);
    }, index * 40);
    });
}

// ================= FIXED LOAD MODS REALTIME =================
function loadModsRealtime() {
    // 1. Ambil status sistem approval terlebih dahulu
    db.collection('settings').doc('system').onSnapshot(settingsDoc => {
        let isApprovalActive = true; // Default aktif jika dokumen tidak ada
        
        if (settingsDoc.exists) {
            isApprovalActive = settingsDoc.data().approvalSystem;
        }

        // 2. Buat query dasar
        let query = db.collection("mods");

        // 3. Terapkan filter HANYA jika sistem approval sedang AKTIF
        // Jika approval MATI, maka semua mod (termasuk yang belum disetujui) akan tampil
        if (isApprovalActive) {
            query = query.where("status", "==", "approved");
        }

        // 4. Jalankan sorting dan listener
        query.orderBy("updatedAt", "desc")
            .onSnapshot(snapshot => {
                mods = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    mods.push({
                        id: doc.id,
                        title: data.title || "Tanpa Judul",
                        desc: data.desc || "",
                        category: data.category || "Lainnya",
                        version: data.version || "v1.0",
                        size: data.size || "-",
                        downloads: data.downloads || 0,
                        link: data.link || "",
                        features: data.features || [],
                        images: Array.isArray(data.images) ? data.images : [],
                        updatedAt: data.updatedAt || data.createdAt || null
                    });
                });

                requestIdleCallback(() => {
                    renderTrending(mods);
                    renderLatest(mods);
                });

                // Update detail panel jika sedang terbuka
                const currentDetailId = document.getElementById("detailPanel").dataset.id;
                if (currentDetailId) {
                    const updated = mods.find(m => m.id === currentDetailId);
                    if (updated) {
                        document.getElementById('detailDownloads').innerText = formatK(updated.downloads || 0);
                    }
                }
            }, err => {
                console.error("Gagal mengambil data: ", err);
                // Catatan: Jika muncul error "Index Required", klik link yang muncul di console log browser untuk membuat index Firestore otomatis
            });
    });
}

// Panggil fungsi utama
loadModsRealtime();


// --- Fungsi openDetail yang sudah diperbaiki ---
/**
 * Fungsi openDetail Versi Optimasi Performa (Anti Lag)
 * Memisahkan proses rendering DOM dan eksekusi animasi transisi.
 */
function openDetail(modId) {
    const mod = mods.find(m => m.id === modId);
    if (!mod) return;

    const panel = document.getElementById('detailPanel');
    
    // 1. Kunci ID saat ini agar tidak tertukar saat proses async
    panel.dataset.id = modId;

    // 2. Persiapkan Data (Load ke DOM sebelum animasi dimulai)
    // Gunakan src sementara untuk menghindari 'flicker' putih
    const mainImg = document.getElementById('mainDetailImage');
    mainImg.style.opacity = '0';
    mainImg.src = mod.images?.[0] || '';
    
    document.getElementById('detailTitle').innerText = mod.title || '';
    
    const descEl = document.getElementById('detailDesc');
    descEl.classList.add('custom-desc');
    descEl.innerHTML = formatMarkdown(mod.desc || '');
    
    document.getElementById('detailCategory').innerText = mod.category || '';
    document.getElementById('detailVersionSub').innerText = mod.version || 'V1.0.0'; 
    document.getElementById('detailSizeBtn').innerText = mod.size || '-';
    document.getElementById('detailSizeGrid').innerText = mod.size || '-';
    document.getElementById('detailUpdatedAt').innerText = timeAgo(mod.updatedAt);
    document.getElementById('detailDownloads').innerText = formatK(mod.downloads || 0);

    // Render Fitur Utama
    const featuresContainer = document.getElementById('detailFeatures');
    featuresContainer.innerHTML = ''; 
    if (mod.features && mod.features.length > 0) {
        mod.features.forEach(feature => {
            const featEl = document.createElement('div');
            featEl.className = "flex items-start gap-3 text-sm text-gray-300 glass-panel p-4 rounded-xl border border-white/5 transition-all hover:bg-white/5 group";
            featEl.innerHTML = `
                <div class="mt-0.5 w-6 h-6 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 border border-brand-red/20 group-hover:scale-110 transition-all shadow-[0_0_10px_rgba(229,37,37,0.1)]">
                    <i class="fa-solid fa-check text-brand-glow text-[10px]"></i>
                </div>
                <span class="font-medium leading-relaxed">${feature}</span>
            `;
            featuresContainer.appendChild(featEl);
        });
    }

    // Render Thumbnails
    const thumbContainer = document.getElementById('thumbnailContainer');
    thumbContainer.innerHTML = '';
    const totalImages = mod.images ? mod.images.length : 0;
    const counterEl = document.getElementById('imageCounter');

    if (totalImages > 1) {
        if(counterEl) {
            counterEl.innerHTML = `<i class="fa-solid fa-camera text-brand-glow"></i> 1 / ${totalImages}`;
            counterEl.style.display = 'flex';
        }
        thumbContainer.style.display = 'flex';
        mod.images.forEach((img, i) => {
            const div = document.createElement('div');
            div.className = `w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 ${i === 0 ? 'border-brand-glow opacity-100 shadow-[0_0_15px_rgba(255,75,75,0.4)]' : 'border-transparent opacity-60'} shrink-0 cursor-pointer transition-all duration-300 hover:opacity-100 hover:scale-105 btn-ripple`;
            div.setAttribute('data-img', img);
            div.onclick = () => changeDetailImage(div);
            div.innerHTML = `<img src="${img}" class="w-full h-full object-cover" loading="eager">`;
            thumbContainer.appendChild(div);    
        });
    } else {
        if(counterEl) counterEl.style.display = 'none';
        thumbContainer.style.display = 'none';
    }

    // Download Button Logic
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = async () => {
        if (!mod.link) return alert("Link tidak tersedia");
        window.open(mod.link, '_blank', 'noopener,noreferrer');
        db.collection("mods").doc(modId).update({
            downloads: firebase.firestore.FieldValue.increment(1)
        }).catch(err => console.error("Stat error:", err));
    };

    // 3. EKSEKUSI ANIMASI (Trik 60fps)
    // Pastikan panel di posisi scroll teratas sebelum muncul
    panel.scrollTop = 0;

    // Double requestAnimationFrame memastikan browser sudah selesai memproses DOM
    // sebelum kita memicu transisi transform CSS.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Kita gunakan class 'is-active' untuk trigger transform: translate3d(0,0,0)
            panel.classList.add('is-active');
            mainImg.style.opacity = '1';
            document.body.style.overflow = 'hidden';
        });
    });
}


function closeDetail() {
    const panel = document.getElementById('detailPanel');
    panel.classList.remove('is-active');
    setTimeout(() => {
        document.body.style.overflow = 'auto';
        document.getElementById('mainDetailImage').src = ''; 
    }, 500);
}

function filterCategory(category) {
    // 1. Logika Filter Data
    const filtered = category.toLowerCase() === 'semua'
        ? mods
        : mods.filter(m => {
            const modCat = (m.category || 'lainnya').toLowerCase();
            const targetCat = category.toLowerCase();

            // Mapping Kata Kunci
            if (targetCat === 'apk tool') {
                const keywords = ["apk", "apk mod", "apk mods"];
                return keywords.some(key => modCat.includes(key));
            }

            if (targetCat === 'game mod') {
                const keywords = ["game", "game mod", "game mods"];
                return keywords.some(key => modCat.includes(key));
            }

            if (targetCat === 'script') {
                return modCat.includes('script');
            }

            // Logika untuk kategori "Lainnya" agar memunculkan "dll", "other", dll.
            if (targetCat === 'lainnya') {
                const keywords = ["lainnya", "other", "dll", "misc", "lainya"];
                return keywords.some(key => modCat.includes(key));
            }

            return modCat === targetCat;
        });

    // 2. Render ulang list (Trending & Terbaru)
    renderTrending(filtered);
    renderLatest(filtered);

    // 3. Update Visual Tombol Aktif
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        // Reset semua tombol ke desain glass default
        btn.className = "category-btn shrink-0 glass-panel hover:bg-white/10 text-gray-300 hover:text-white px-6 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all btn-ripple";
        
        // Ikon color reset
        const icon = btn.querySelector('i');
        if(icon) {
            icon.classList.remove('text-white');
            if(!icon.classList.contains('text-brand-glow')) {
                icon.classList.add('text-brand-glow', 'opacity-80');
            }
        }

        // Cek tombol mana yang sedang diklik berdasarkan atribut
        const onclickValue = btn.getAttribute('onclick');
        if (onclickValue && onclickValue.includes(`'${category}'`)) {
            // Apply Premium Active State
            btn.className = "category-btn shrink-0 bg-gradient-to-r from-brand-red to-brand-dark text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-glow-red flex items-center gap-2 btn-ripple border border-brand-red/50 transition-all";
            if(icon) {
                icon.classList.remove('text-brand-glow', 'opacity-80');
                icon.classList.add('text-white');
            }
        }
    });
}

// --- Fungsi changeDetailImage yang dioptimalkan ---
function changeDetailImage(el) {
    const mainImage = document.getElementById('mainDetailImage');
    const newImage = el.getAttribute('data-img');
    
    // Efek transisi sinematik saat ganti gambar
    mainImage.style.opacity = '0';
    setTimeout(() => {
        mainImage.src = newImage;
        mainImage.style.opacity = '1';
    }, 150);

    // Update Indikator Angka (Dinamis)
    const thumbs = document.querySelectorAll('#thumbnailContainer [data-img]');
    const allThumbs = Array.from(thumbs);
    const currentIndex = allThumbs.indexOf(el) + 1;
    const totalImages = allThumbs.length;
    
    const counterEl = document.getElementById('imageCounter');
    if (counterEl) {
        counterEl.innerHTML = `<i class="fa-solid fa-camera text-brand-glow"></i> ${currentIndex} / ${totalImages}`;
    }

    // Update Visual Border Thumbnail (Premium Glow)
    thumbs.forEach(t => {
        t.classList.remove('border-brand-glow', 'shadow-[0_0_15px_rgba(255,75,75,0.4)]', 'opacity-100');
        t.classList.add('border-transparent', 'opacity-60');
    });

    el.classList.remove('border-transparent', 'opacity-60');
    el.classList.add('border-brand-glow', 'shadow-[0_0_15px_rgba(255,75,75,0.4)]', 'opacity-100');
}

function timeAgo(timestamp) {
    if (!timestamp) return "Baru saja";
    
    // Konversi timestamp Firebase ke Date JavaScript
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " tahun lalu";
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " bulan lalu";
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " hari lalu";
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " jam lalu";
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " menit lalu";
    
    return "Baru saja";
}

function formatK(num) {
    if (num === 0 || !num) return "0"; 
    return num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
}

function formatMarkdown(text) {
    if (!text) return "";
    let formatted = text
        .replace(/\*(.*?)\*/g, '<b>$1</b>')             // Bold
        .replace(/_(.*?)_/g, '<i>$1</i>')               // Italic
        .replace(/`(.*?)`/g, '<code>$1</code>')         // Code
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="custom-link">$1</a>') // Link: [teks](url)
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>') // Quote
        .replace(/• (.*)/g, '<span class="bullet-point">$1</span>'); // Bullet

    return formatted.split('\n').map(line => {
        if (line.includes('</blockquote>') || line.includes('</span>')) {
            return line; 
        }
        return line + '<br>'; 
    }).join('');
}

// ================= RENDER LATEST (UI UPGRADED) =================
function renderLatest(data) {
    const container = document.getElementById("latestList");
    container.innerHTML = "";

    // 1. Sortir data berdasarkan download TERBANYAK ke TERKECIL
    const trendingData = [...data].sort((a, b) => {
        return (b.downloads || 0) - (a.downloads || 0);
    });

    // 2. Ambil 5 data teratas saja
    trendingData.slice(0, 5).forEach(mod => {
        const el = document.createElement("div");
        // Inject Premium List Classes
        el.className = "flex items-center gap-4 p-3.5 glass-panel hover:bg-white/10 rounded-[20px] transition-all duration-300 cursor-pointer group hover:border-brand-red/30 hover:shadow-glow-red border border-white/5";
        el.onclick = () => openDetail(mod.id);

        const modImage = (mod.images && mod.images.length > 0) ? mod.images[0] : 'https://placehold.co/100';
        
        el.innerHTML = `
            <div class="relative w-[60px] h-[60px] rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-glass">
                <img 
    src="${modImage}" 
    loading="lazy" 
    decoding="async" 
    fetchpriority="low" 
    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
>
                <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div class="flex-1 min-w-0 pr-2">
                <h4 class="font-display font-bold text-[14px] text-white truncate group-hover:text-brand-glow transition-colors mb-1 drop-shadow-md">${mod.title}</h4>
                <div class="flex items-center gap-2.5 text-[11px] font-medium text-gray-400">
                    <span class="flex items-center gap-1.5 text-brand-glow drop-shadow-[0_0_8px_rgba(255,75,75,0.8)]">
    <i class="fa-solid fa-download text-xs"></i> ${formatK(mod.downloads || 0)}
</span>
                    <span class="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span class="uppercase tracking-widest text-[9px] text-gray-300">${mod.category || ''}</span>
                </div>
            </div>
            <div class="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-brand-red/20 group-hover:border-brand-red/40 transition-all duration-300 shadow-sm shrink-0">
                <i class="fa-solid fa-chevron-right text-gray-400 group-hover:text-brand-glow text-xs transition-colors"></i>
            </div>
        `;
        container.appendChild(el);
    });
}

/* ================= ANNOUNCEMENT POPUP ================= */
// 1. Fungsi Universal untuk Menutup Semua Jenis Popup
function closeAllAnnouncements() {
    document.getElementById('announcementModal').classList.add('hidden');
    document.getElementById('visualAnnouncement').classList.add('hidden');
    document.body.style.overflow = 'auto'; // Mengembalikan scroll body
}

// 2. Real-time Listener (Satu-satunya yang aktif)
db.collection('announcements').doc('main').onSnapshot((doc) => {
    if (!doc.exists) return;
    const data = doc.data();

    // Sembunyikan semua jika status "active" adalah false
    if (!data.active) {
        closeAllAnnouncements();
        return;
    }

    // CEK: Jika ada URL gambar, gunakan Modal Visual. Jika tidak, gunakan Modal Teks.
    if (data.image && data.image.trim() !== "") {
        renderVisualAnnouncement(data);
    } else {
        renderTextAnnouncement(data);
    }
});

// 3. Logika Render Modal Teks
function renderTextAnnouncement(data) {
    const modal = document.getElementById('announcementModal');
    const titleEl = modal.querySelector('h2');
    const textEl = modal.querySelector('p');
    const btn = document.getElementById('announcementButton');

    titleEl.innerText = data.title || "Announcement";
    textEl.classList.add('custom-desc');
    textEl.innerHTML = formatMarkdown(data.text || "");
    
    if (data.link && data.link.trim() !== "") {
        btn.classList.remove('hidden');
        btn.onclick = () => window.open(data.link, '_blank');
    } else {
        btn.classList.add('hidden');
    }

    document.getElementById('visualAnnouncement').classList.add('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 4. Logika Render Modal Visual (Dengan Gambar)
function renderVisualAnnouncement(data) {
    const modal = document.getElementById('visualAnnouncement');
    const imgEl = document.getElementById('announcement-img-display');
    const textEl = document.getElementById('announcement-text-display');
    const tagEl = document.getElementById('announcement-tag');
    const linkBtn = document.getElementById('announcement-link-btn');

    imgEl.src = data.image;
    tagEl.innerText = data.title || "NEW UPDATE";
    textEl.classList.add('custom-desc');
    textEl.innerHTML = formatMarkdown(data.text || "");
    
    if (data.link && data.link.trim() !== "") {
        linkBtn.classList.remove('hidden');
        linkBtn.onclick = (e) => {
            e.preventDefault();
            window.open(data.link, '_blank');
        };
    } else {
        linkBtn.classList.add('hidden');
    }

    document.getElementById('announcementModal').classList.add('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function scrollToBottomDetail() {
    const panel = document.getElementById('detailPanel');
    if (panel) {
        panel.scrollTo({
            top: panel.scrollHeight,
            behavior: 'smooth'
        });
    }
}
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.08
});

document.querySelectorAll('.animate-fade-up').forEach(el => {
    observer.observe(el);
});
