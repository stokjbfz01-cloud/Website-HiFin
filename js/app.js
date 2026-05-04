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

// ==========================
// PUBLIC UPLOAD SYSTEM
// ==========================

const uploadModal = document.getElementById("uploadModal");
const openUploadBtn = document.getElementById("openUpload");

// OPEN MODAL
openUploadBtn.onclick = () => {
  uploadModal.style.display = "flex";
};

function closeUpload() {
  uploadModal.style.display = "none";
}

// CLOUDINARY (SAMA SEPERTI ADMIN)
async function uploadImagePublic(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Hifin_Web');

  const res = await fetch('https://api.cloudinary.com/v1_1/dvch9imk2/image/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

// QUEUE SYSTEM
async function processQueuePublic() {
  if (isUploadingPublic) return;
  isUploadingPublic = true;

  while (uploadQueuePublic.length > 0) {
    const { file, index } = uploadQueuePublic.shift();
    try {
      const url = await uploadImagePublic(file);
      uploadedPublic[index] = url;
    } catch (e) {
      console.error(e);
    }
  }

  isUploadingPublic = false;
}

// ================= SAFE INIT =================
window.addEventListener("DOMContentLoaded", () => {

  const openUploadBtn = document.getElementById("openUpload");
  const uploadModal = document.getElementById("uploadModal");

  const uImg1 = document.getElementById("uImg1");
  const uImg2 = document.getElementById("uImg2");
  const submitBtn = document.getElementById("submitUpload");

  if (!openUploadBtn || !uploadModal) {
    console.error("Upload element tidak ditemukan!");
    return;
  }

  // OPEN MODAL
  openUploadBtn.onclick = () => {
    uploadModal.style.display = "flex";
    document.body.classList.add("no-scroll");
  };

  window.closeUpload = () => {
    uploadModal.style.display = "none";
    document.body.classList.remove("no-scroll");
  };

  let uploadQueue = [];
  let uploaded = [null, null];
  let isUploading = false;

  async function uploadImage(file) {
  console.log("Mulai upload:", file.name);

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "Hifin_Web");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dvch9imk2/image/upload", {
      method: "POST",
      body: fd
    });

    const data = await res.json();

    console.log("Response Cloudinary:", data);

    if (!data.secure_url) {
      throw new Error("Upload gagal - URL tidak ada");
    }

    return data.secure_url;

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert("Upload gambar gagal!");
    return null;
  }
}

  async function processQueue() {
  if (isUploading) return;
  isUploading = true;

  while (uploadQueue.length > 0) {
    const { file, index } = uploadQueue.shift();

    const bar = document.getElementById(`pubProg${index+1}`);
    if (bar) bar.style.width = "30%";

    const url = await uploadImage(file);

    if (url) {
      uploaded[index] = url;
      if (bar) {
        bar.style.width = "100%";
        bar.style.background = "#22c55e";
      }
    } else {
      if (bar) bar.style.background = "red";
    }
  }

  isUploading = false;
}

  // FIX NULL ERROR DI SINI
  if (uImg1) {
  uImg1.onchange = (e) => {
    console.log("File dipilih (Gambar 1):", e.target.files[0]);

    if (e.target.files[0]) {
      uploadQueue.push({ file: e.target.files[0], index: 0 });
      processQueue();
    }
  };
}

  if (uImg2) {
  uImg2.onchange = (e) => {
    console.log("File dipilih (Gambar 2):", e.target.files[0]);

    if (e.target.files[0]) {
      uploadQueue.push({ file: e.target.files[0], index: 1 });
      processQueue();
    }
  };
}

  if (submitBtn) {
    console.log("Uploaded images:", uploaded);
    submitBtn.onclick = async () => {
      if (isUploading) return alert("Tunggu upload selesai!");

      const title = document.getElementById("uTitle").value;
      const desc = document.getElementById("uDesc").value;
      const category = document.getElementById("uCategory").value;
      const link = document.getElementById("uLink").value;

      console.log("CHECK SUBMIT:");
console.log("Title:", title);
console.log("Uploaded:", uploaded);

if (!title) {
  alert("Judul kosong!");
  return;
}

if (!uploaded[0]) {
  alert("Gambar belum selesai upload!");
  return;
}

      await db.collection("mods").add({
        title,
        desc,
        category,
        link,
        images: uploaded.filter(i => i !== null),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Berhasil upload!");
      closeUpload();
    };
  }

});
