const firebaseConfig = {
  apiKey: "AIzaSyBoGzExHCZvLNnLHggB2sbst0t4l-tc3Mk",
  authDomain: "mods-31307.firebaseapp.com",
  projectId: "mods-31307",
  storageBucket: "mods-31307.appspot.com",
  messagingSenderId: "913890186204",
  appId: "1:913890186204:web:4a652535f0fba62bda7519"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let mods = [];
let filteredMods = [];
let currentSort = "Terbaru";
let currentCategory = "SEMUA Kategori";
let unsubscribeMods = null;

        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        dark: {
                            950: '#050505',
                            900: '#09090b',
                            800: '#121216',
                            700: '#18181c',
                            600: '#272730'
                        },
                        brand: {
                            red: '#e52525',
                            neon: '#ff3b3b',
                            dark: '#8a1010',
                            glow: 'rgba(229, 37, 37, 0.5)'
                        }
                    },
                    fontFamily: { 
                        sans: ['Plus Jakarta Sans', 'sans-serif'], 
                        display: ['Poppins', 'sans-serif'] 
                    },
                    boxShadow: {
                        'glow-sm': '0 0 15px rgba(255, 59, 59, 0.15)',
                        'glow-md': '0 0 25px rgba(255, 59, 59, 0.3)',
                        'glow-lg': '0 0 40px rgba(255, 59, 59, 0.5)',
                        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                    },
                    transitionTimingFunction: {
                        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
                        'elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }
                }
            }
        }

// ================= LOAD DATA REALTIME =================
function loadModsRealtime() {
    const grid = document.getElementById("mod-grid");
    grid.innerHTML = Array(8).fill(0).map(() => `
        <div class="glass-panel rounded-2xl h-[280px] overflow-hidden border border-white/5 relative">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
    `).join('');
    if (unsubscribeMods) {
        unsubscribeMods();
    }
    unsubscribeMods = db.collection("mods")
        .where("status", "==", "approved")
        .orderBy("updatedAt", "desc")
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
                    features: Array.isArray(data.features)
                        ? data.features
                        : [],
                    images: Array.isArray(data.images)
                        ? data.images
                        : [],
                    updatedAt: data.updatedAt || data.createdAt || null
                });
            });
            document.getElementById("totalCardCount").innerText =
                mods.length + " Card";
            applyFilters();
        }, error => {
            console.error("Firestore Error:", error);
            grid.innerHTML = `
                <div class="col-span-full text-center py-20 text-red-400">
                    Gagal memuat database mod.
                </div>
            `;
        });
}

// ================= RENDER GRID (REDESIGNED HTML STRING) =================
function renderGrid(data) {
    const grid = document.getElementById("mod-grid");
    grid.innerHTML = "";

    if (data.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 stagger-item">
                <i class="fa-solid fa-ghost text-5xl mb-4 opacity-20"></i>
                <p class="font-display font-medium text-lg">Tidak ada modifikasi ditemukan</p>
                <p class="text-sm mt-1">Coba gunakan kata kunci atau kategori lain.</p>
            </div>`;
        return;
    }

    data.forEach((mod, i) => {
        const img = mod.images?.[0] || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600";
        const card = document.createElement("div");
        
        // Premium Card Classes
        card.className = `mod-card group relative bg-dark-800/40 backdrop-blur-xl rounded-[24px] overflow-hidden border border-white/5 cursor-pointer stagger-item shadow-glass`;
        card.style.animationDelay = `${i * 0.05}s`;
        card.onclick = () => openDetail(mod.id);

        card.innerHTML = `
            <!-- Top Badge -->
            <div class="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-brand-neon text-[9px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-glow-sm">
                <div class="w-1.5 h-1.5 rounded-full bg-brand-neon pulse-dot"></div>
                ${mod.category || "UNKNOWN"}
            </div>

            <!-- Version Badge Right -->
            <div class="absolute top-4 right-4 z-20 bg-brand-red/10 border border-brand-red/30 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-glow-sm">
                ${mod.version || 'v1.0'}
            </div>

            <!-- Image Area -->
            <div class="h-[200px] w-full relative overflow-hidden img-container">
                <img 
    src="${img}" 
    class="w-full h-full object-cover"
    loading="lazy"
    onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'"
>
                
                <!-- Cinematic Gradient Overlays -->
                <div class="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent z-10"></div>
                <div class="absolute inset-0 bg-brand-red/0 group-hover:bg-brand-red/10 transition-colors duration-500 z-10"></div>
                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-dark-800 to-transparent z-10"></div>
            </div>

            <!-- Content Area -->
            <div class="p-5 relative z-20 -mt-6">
                <h4 class="font-display font-bold text-lg text-white mb-3 line-clamp-2 leading-tight group-hover:text-brand-neon transition-colors duration-300 drop-shadow-md">
                    ${mod.title}
                </h4>

                <div class="flex items-center gap-2 mb-4">
                    <div class="flex items-center gap-1.5 bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px] text-gray-300 shadow-inner-light">
                        <i class="fa-solid fa-download text-brand-red"></i> 
                        <span class="font-medium">${formatK(mod.downloads || 0)}</span>
                    </div>
                    <div class="flex items-center gap-1.5 bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px] text-gray-300 shadow-inner-light">
                        <i class="fa-solid fa-file-code text-brand-red"></i>
                        <span class="font-medium">${mod.size || '-'}</span>
                    </div>
                </div>

                <div class="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-3"></div>

                <div class="flex items-center justify-between text-[11px] text-gray-500">
                    <span class="flex items-center gap-1.5 font-medium">
                        <i class="fa-regular fa-clock"></i> ${timeAgo(mod.updatedAt)}
                    </span>
                    <i class="fa-solid fa-arrow-right -rotate-45 text-brand-neon opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"></i>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ================= FILTER + SORT (LOGIC DIPERTAHANKAN) =================
function applyFilters() {
    let data = [...mods];

    const map = {
        "apk mods": ["apk", "apk mods"],
        "game mods": ["game", "game mods"],
        "scripts": ["script"],
        "lainnya": ["lainnya", "other", "dll", "misc", "lainya"]
    };

    if (currentCategory !== "SEMUA Kategori") {
        const selected = currentCategory.toLowerCase().trim();
        data = data.filter(m => {
            const cat = (m.category || "lainnya").toLowerCase();
            return map[selected]?.some(keyword => cat.includes(keyword));
        });
    }

    if (currentSort === "Terpopuler") {
        data.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else {
        data.sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(0);
            const bTime = b.updatedAt?.toDate?.() || new Date(0);
            return bTime - aTime;
        });
    }

    filteredMods = data;
    renderGrid(filteredMods);
}

// ================= SEARCH & LISTENERS (DIPERTAHANKAN) =================
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector('input[type="text"]');
    let searchTimeout = null;
searchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const keyword = e.target.value
            .toLowerCase()
            .trim();
        const result = filteredMods.filter(m =>
            m.title.toLowerCase().includes(keyword)
        );
        renderGrid(result);
    }, 250);
});
});
document.getElementById("sortSelect").addEventListener("change", e => {
    currentSort = e.target.value;
    applyFilters();
});
document.getElementById("categorySelect").addEventListener("change", e => {
    currentCategory = e.target.value;
    applyFilters();
});

// ================= UTIL (DIPERTAHANKAN) =================
function formatK(num) {
    if (num === 0 || !num) return "0";
    return num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatMarkdown(text) {
    if (!text) return "";

    let safe = escapeHTML(text);

    safe = safe
        .replace(/\*(.*?)\*/g, '<b>$1</b>')
        .replace(/_(.*?)_/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/• (.*)/g, '<span class="bullet-point">$1</span>');

    return safe.split('\n').map(line => {
        if (
            line.includes('</blockquote>') ||
            line.includes('</span>')
        ) {
            return line;
        }

        return line + '<br>';
    }).join('');
}

function timeAgo(timestamp) {
    if (!timestamp) return "Baru saja";
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

loadModsRealtime();

// ================= DETAIL LOGIC (DIPERTAHANKAN DGN UPGRADE UI) =================
function openDetail(modId) {
    const mod = mods.find(m => m.id === modId);
    if (!mod) return;

    const panel = document.getElementById('detailPanel');
    const backdrop = document.getElementById('panelBackdrop');

    // SET DATA
    document.getElementById('mainDetailImage').src = mod.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
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

    // IMAGE COUNTER LOGIC
    const totalImages = mod.images ? mod.images.length : 0;
    const counterEl = document.getElementById('imageCounter');
    if (counterEl) {
        if (totalImages > 1) {
            counterEl.innerText = `1 / ${totalImages}`;
            counterEl.style.display = 'flex';
        } else {
            counterEl.style.display = 'none';
        }
    }

    // FEATURES MAPPING (Upgraded Style)
    const featuresContainer = document.getElementById('detailFeatures');
    featuresContainer.innerHTML = ''; 
    if (mod.features && Array.isArray(mod.features) && mod.features.length > 0) {
        mod.features.forEach(feature => {
            const featEl = document.createElement('div');
            featEl.className = "flex items-start gap-3 glass-panel p-3.5 rounded-xl transition hover:bg-white/5 group";
            featEl.innerHTML = `
                <div class="mt-0.5 w-6 h-6 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 border border-brand-red/20 group-hover:scale-110 group-hover:bg-brand-red/20 transition-all duration-300">
                    <i class="fa-solid fa-check text-brand-neon text-[10px] shadow-glow-sm"></i>
                </div>
                <span class="font-medium text-gray-300 text-sm leading-relaxed">${feature}</span>
            `;
            featuresContainer.appendChild(featEl);
        });
    } else {
        featuresContainer.innerHTML = `<p class="text-sm text-gray-500 italic bg-dark-800/50 p-4 rounded-xl text-center border border-white/5">Sistem belum mendeteksi fitur spesifik.</p>`;
    }

    // RENDER THUMBNAILS (Upgraded Style)
    const thumbContainer = document.getElementById('thumbnailContainer');
    thumbContainer.innerHTML = '';
    if (totalImages <= 1) {
        thumbContainer.style.display = 'none';
    } else {
        thumbContainer.style.display = 'flex';
        (mod.images || []).forEach((img, i) => {
            const div = document.createElement('div');
            // Tetap gunakan class ID aslinya untuk fungsi changeDetailImage
            div.className = `w-16 h-16 rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-brand-red opacity-100 shadow-glow-md' : 'border-transparent opacity-60 hover:opacity-100'} shrink-0 cursor-pointer transition-all duration-300 hover:scale-105`;
            div.setAttribute('data-img', img);
            div.onclick = () => changeDetailImage(div);
            div.innerHTML = `<img src="${img}" class="w-full h-full object-cover">`;
            thumbContainer.appendChild(div);
        });
    }

    // DOWNLOAD ACTION (DIPERTAHANKAN)
    document.getElementById('downloadBtn').onclick = async () => {
        if (mod.link) {
            try {
                await db.collection("mods").doc(modId).update({
                    downloads: firebase.firestore.FieldValue.increment(1)
                });
                window.open(mod.link);
            } catch (err) { console.error(err); window.open(mod.link, '_blank', 'noopener,noreferrer'); }
        }
    };

    // ANIMATION OPEN (Lebih Smooth)
    document.body.classList.add('detail-open');
    if (window.innerWidth < 768) {
    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');
} else {
    panel.classList.remove('translate-y-full');
    panel.classList.add('translate-y-0');
}
    document.body.style.overflow = 'hidden';
}

function closeDetail() {
    const panel = document.getElementById('detailPanel');
    document.body.classList.remove('detail-open');
    
    // Animasikan keluar
    if (window.innerWidth < 768) {
        panel.classList.remove('translate-x-0');
        panel.classList.add('translate-x-full');
    } else {
        panel.classList.remove('translate-y-0', 'translate-x-0');
        panel.classList.add('translate-y-full');
    }
    
    setTimeout(() => {
        document.body.style.overflow = 'auto';
    }, 400); // Sesuaikan dengan durasi animasi
}

function changeDetailImage(el) {
    const mainImage = document.getElementById('mainDetailImage');
    const newImage = el.getAttribute('data-img');
    mainImage.style.opacity = '0';
    mainImage.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        mainImage.src = newImage;
        mainImage.style.opacity = '1';
        mainImage.style.transform = 'scale(1)';
    }, 250);

    const thumbs = document.querySelectorAll('#thumbnailContainer [data-img]');
    const allThumbs = Array.from(thumbs);
    const currentIndex = allThumbs.indexOf(el) + 1;
    document.getElementById('imageCounter').innerHTML = `<i class="fa-solid fa-camera mr-1.5 text-brand-neon"></i> ${currentIndex} / ${allThumbs.length}`;

    // Logic CSS toggle yang dipertahankan namun style diupgrade
    thumbs.forEach(t => {
        t.classList.remove('border-brand-red', 'shadow-glow-md', 'opacity-100');
        t.classList.add('border-transparent', 'opacity-60');
    });
    el.classList.remove('border-transparent', 'opacity-60');
    el.classList.add('border-brand-red', 'shadow-glow-md', 'opacity-100');
}

// Tutup panel jika klik backdrop
document.getElementById('panelBackdrop').addEventListener('click', closeDetail);
