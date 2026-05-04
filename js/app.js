// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBoGzExHCZvLNnLHggB2sbst0t4l-tc3Mk",
  authDomain: "mods-31307.firebaseapp.com",
  projectId: "mods-31307",
  storageBucket: "mods-31307.firebasestorage.app",
  messagingSenderId: "913890186204",
  appId: "1:913890186204:web:4a652535f0fba62bda7519"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables
let mods = [];
let currentCategory = "ALL";
let currentImages = [];
let currentIndex = 0;
let unsubscribe = null;
let searchTimeout;
let activeCardElement = null;

// DOM
const app = document.getElementById("app");
const introWrapper = document.getElementById("introWrapper");
const detailPanel = document.getElementById("detailPanel");
const modsList = document.getElementById("modsList");

// --- INTRO ---
window.addEventListener("load", () => {
  document.body.classList.add("no-scroll");
  setTimeout(() => {
    introWrapper.style.opacity = "0";
    introWrapper.style.visibility = "hidden";
    app.classList.add("show");
    document.body.classList.remove("no-scroll");
    loadModsRealtime();
    setTimeout(() => introWrapper.remove(), 600);
  }, 4000);
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- RENDER MODS ---
function applyFilter() {
  let filtered = [...mods];
  if (currentCategory !== "ALL") {
    filtered = filtered.filter(m => m.category === currentCategory);
  }
  const searchInput = document.getElementById("search");
  const keyword = searchInput ? searchInput.value.toLowerCase() : "";
  filtered = filtered.filter(m => {
    const title = (m.title || "").toLowerCase();
    const desc = (m.desc || "").toLowerCase();
    return title.includes(keyword) || desc.includes(keyword);
  });
  renderMods(filtered);
}

function renderMods(data) {
  const fragment = document.createDocumentFragment();
  data.forEach((mod, idx) => {
    const card = createCard(mod, idx);
    card.style.animationDelay = `${Math.min(idx * 0.03, 0.3)}s`;
    fragment.appendChild(card);
  });
  modsList.innerHTML = "";
  modsList.appendChild(fragment);
}

function createCard(mod, realIndex) {
  const card = document.createElement("div");
  card.className = "card";
  const imgUrl = (mod.images && mod.images[0]) ? mod.images[0] : 'https://placehold.co/400x300?text=No+Image';
  const optimizedThumb = `https://images.weserv.nl/?url=${encodeURIComponent(imgUrl)}&w=400&h=300&fit=cover&output=webp&q=80`;
  
  card.innerHTML = `
    <div class="category-badge"><i class="fa-solid fa-tag"></i> ${mod.category}</div>
    <div class="thumb">
      <img src="${optimizedThumb}" class="lazy-img" onload="this.classList.add('loaded')" loading="lazy" alt="${mod.title}">
    </div>
    <div class="card-body">
      <h4 class="card-title">${mod.title || "Untitled"}</h4>
      <p class="card-desc">${mod.desc || "No description."}</p>
      <button class="btn-detail download-btn" data-index="${mods.indexOf(mod)}">
        <i class="fa-solid fa-bolt"></i> Lihat Selengkapnya
      </button>
    </div>
  `;
  return card;
}

// --- DETAIL PANEL ---
modsList.addEventListener("click", (e) => {
  const btn = e.target.closest('.download-btn');
  if (btn) {
    activeCardElement = btn.closest('.card');
    openDetail(parseInt(btn.dataset.index));
  }
});

function openDetail(index) {
  const mod = mods[index];
  if (!mod || !activeCardElement) return;
  currentImages = Array.isArray(mod.images) ? mod.images : (mod.image ? [mod.image] : []);
  if (currentImages.length > 0) {
    currentIndex = 0;
    updateDetailImage();
  }
  document.getElementById("detailTitle").innerText = mod.title;
  document.getElementById("detailTitleTop").innerText = mod.title;
  document.getElementById("detailDesc").innerText = mod.desc;
  document.getElementById("detailCategory").innerText = mod.category;
  document.getElementById("detailDownloadSmall").onclick = () => window.open(mod.link);

  const cardRect = activeCardElement.getBoundingClientRect();
  detailPanel.style.transition = 'none';
  detailPanel.style.left = `${cardRect.left}px`;
  detailPanel.style.top = `${cardRect.top}px`;
  detailPanel.style.width = `${cardRect.width}px`;
  detailPanel.style.height = `${cardRect.height}px`;
  detailPanel.style.borderRadius = '20px';
  detailPanel.style.opacity = '1';
  
  requestAnimationFrame(() => {
    detailPanel.style.transition = '';
    detailPanel.classList.add("full");
    app.classList.add("depth");
    document.body.classList.add("no-scroll");
  });
}

function closeDetail() {
  if (!activeCardElement) return;
  const cardRect = activeCardElement.getBoundingClientRect();
  detailPanel.classList.remove("full");
  app.classList.remove("depth");
  document.body.classList.remove("no-scroll");
  detailPanel.style.left = `${cardRect.left}px`;
  detailPanel.style.top = `${cardRect.top}px`;
  detailPanel.style.width = `${cardRect.width}px`;
  detailPanel.style.height = `${cardRect.height}px`;
  detailPanel.style.borderRadius = '20px';
  setTimeout(() => {
    detailPanel.style.opacity = '0';
    activeCardElement = null;
  }, 600);
}

let touchStartY = 0;
detailPanel.addEventListener('touchstart', (e) => {
  if (!detailPanel.classList.contains('full')) return;
  touchStartY = e.touches[0].clientY;
});
detailPanel.addEventListener('touchmove', (e) => {
  if (!detailPanel.classList.contains('full')) return;
  const deltaY = e.touches[0].clientY - touchStartY;
  if (deltaY > 50) {
    closeDetail();
    e.preventDefault();
  }
});
document.getElementById("detailBackBtn").addEventListener("click", closeDetail);

function updateDetailImage() {
  if (currentImages[currentIndex]) {
    const imgElement = document.getElementById("detailImg");
    imgElement.style.filter = 'blur(6px)';
    imgElement.style.transform = 'scale(1.02)';
    imgElement.src = `https://images.weserv.nl/?url=${encodeURIComponent(currentImages[currentIndex])}&w=800&fit=cover&output=webp&q=85`;
    imgElement.onload = () => {
      imgElement.style.filter = 'blur(0)';
      imgElement.style.transform = 'scale(1)';
    };
  }
}
document.getElementById("prevImgBtn").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateDetailImage();
});
document.getElementById("nextImgBtn").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateDetailImage();
});

// --- FIRESTORE LISTENER (REALTIME) ---
function loadModsRealtime() {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("mods").orderBy("updatedAt", "desc").onSnapshot(snapshot => {
    mods = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.title) {
        mods.push({ 
          id: doc.id, 
          ...data, 
          updatedAt: data.updatedAt || 0, 
          images: data.images || (data.image ? [data.image] : []) 
        });
      }
    });
    applyFilter();
  });
}

// --- SEARCH & CATEGORY FILTER ---
document.getElementById("search").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilter, 200);
});

document.querySelectorAll(".cat-item").forEach(el => {
  el.addEventListener("click", () => {
    currentCategory = el.dataset.cat;
    document.querySelectorAll(".cat-item").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    applyFilter();
  });
});
