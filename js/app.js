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
const auth = firebase.auth();

// Variables
let mods = [];
let currentCategory = "ALL";
let editIndex = null;
let currentImages = [];
let currentIndex = 0;
let uploadQueue = [];
let isUploading = false;
let unsubscribe = null;
let uploadedImages = [null, null, null, null];
let editUploadedImages = [null, null, null, null];
let searchTimeout;
let isAdminLoggedIn = false;
let activeCardElement = null;

// DOM
const app = document.getElementById("app");
const introWrapper = document.getElementById("introWrapper");
const pinPanel = document.getElementById("pinPanel");
const menuPanel = document.getElementById("menuPanel");
const uploadPanel = document.getElementById("uploadPanel");
const editPanel = document.getElementById("editPanel");
const editFormPanel = document.getElementById("editFormPanel");
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

// --- PANEL dengan transisi yang sudah diatur di CSS (active class) ---
function openPanel(panel) { 
  panel.classList.add("active"); 
  document.body.classList.add("no-scroll"); 
}
function closePanel(panel) { 
  panel.classList.remove("active"); 
  document.body.classList.remove("no-scroll"); 
}
function openPin() { openPanel(pinPanel); }
function closePin() { closePanel(pinPanel); }
function closeMenu() { closePanel(menuPanel); }
function openUploadDirect() { openPanel(uploadPanel); }
function openUpload() { closePanel(menuPanel); openPanel(uploadPanel); }
function closeUpload() { 
  closePanel(uploadPanel); 
  resetUploadForm();
}
function openEdit() { closePanel(menuPanel); openPanel(editPanel); loadEditList(); }
function closeEditPanel() { closePanel(editPanel); }
function closeEditForm() { editFormPanel.classList.remove("active"); editPanel.classList.add("active"); }

// --- RENDER MODS dengan STAGGER ANIMATION ---
function applyFilter() {
  let filtered = mods;
  if (currentCategory !== "ALL") filtered = filtered.filter(m => m.category === currentCategory);
  const keyword = document.getElementById("search").value.toLowerCase();
  filtered = filtered.filter(m => m.title.toLowerCase().includes(keyword) || m.desc.toLowerCase().includes(keyword));
  renderMods(filtered);
}

function renderMods(data) {
  const fragment = document.createDocumentFragment();
  data.forEach((mod, idx) => {
    const card = createCard(mod, idx);
    // Stagger delay berdasarkan indeks (maks 0.3s)
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
      <img src="${optimizedThumb}" loading="lazy" alt="${mod.title}">
    </div>
    <div class="card-body">
      <h4 class="card-title">${mod.title}</h4>
      <p class="card-desc">${mod.desc}</p>
      <button class="btn-detail download-btn" data-index="${mods.indexOf(mod)}">
        <i class="fa-solid fa-bolt"></i> Lihat Selengkapnya
      </button>
    </div>
  `;
  return card;
}

// --- DETAIL PANEL dengan GESTURE SWIPE CLOSE ---
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

// Gesture swipe down untuk menutup detail
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

// Image transition dengan zoom & blur
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

// --- PIN & AUTH (tetap sama) ---
function checkPin() {
  const pin = document.getElementById("pinInput").value;
  if (pin === "089514") {
    openPanel(menuPanel);
    const menuButtons = document.getElementById("menuButtons");
    if (isAdminLoggedIn) {
      document.getElementById("menuTitle").innerHTML = "<i class='fa-solid fa-terminal'></i> Terminal Admin";
      menuButtons.innerHTML = `
        <button class="btn-submit" onclick="openUpload()"><i class="fa-solid fa-upload"></i> Upload Mod</button>
        <button class="btn-submit" onclick="openEdit()" style="background:#f59e0b;"><i class="fa-solid fa-pen"></i> Kelola Mod</button>
        <button class="btn-submit" id="logoutBtn" style="background:#ef4444;"><i class="fa-solid fa-power-off"></i> Logout</button>
        <button onclick="closeMenu()" style="background:#e2e8f0; color:#333;">Tutup Panel</button>
      `;
      document.getElementById("logoutBtn").addEventListener("click", () => {
        auth.signOut().then(() => {
          closeMenu(); closePin();
          alert("Anda telah logout.");
        });
      });
    } else {
      document.getElementById("menuTitle").innerText = "Otentikasi Firebase";
      menuButtons.innerHTML = `
        <button class="btn-submit" onclick="loginAdmin()">Login Akun Admin</button>
        <button onclick="closeMenu()" style="background:#e2e8f0; color:#333;">Batal</button>
      `;
    }
  } else { alert("Akses Ditolak: PIN Salah!"); }
}

function loginAdmin() {
  const email = prompt("Email Admin:");
  const password = prompt("Password Admin:");
  auth.signInWithEmailAndPassword(email, password)
    .then(() => { alert("Autentikasi Berhasil!"); closeMenu(); })
    .catch(() => alert("Gagal login!"));
}
auth.onAuthStateChanged(user => { isAdminLoggedIn = (user && user.email === "stokjbfz01@gmail.com"); });

// Firestore Listener
function loadModsRealtime() {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("mods").orderBy("updatedAt", "desc").onSnapshot(snapshot => {
    mods = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      mods.push({ id: doc.id, ...data, updatedAt: data.updatedAt || 0, images: data.images || [data.image] });
    });
    applyFilter();
  });
}

// --- Upload & Edit (tetap sama) ---
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Hifin_Web");
  const res = await fetch("https://api.cloudinary.com/v1_1/dvch9imk2/image/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error("Upload gagal");
  return data.secure_url;
}
async function processQueue() {
  if (isUploading) return;
  isUploading = true;
  
  while (uploadQueue.length > 0) {
    const { file, index, mode } = uploadQueue.shift();
    const barId = (mode === "edit" ? "editProgress" : "progress") + (index + 1);
    const progressBar = document.getElementById(barId);

    try {
      const url = await uploadImage(file);
      if (mode === "edit") editUploadedImages[index] = url;
      else uploadedImages[index] = url;

      if (progressBar) {
        progressBar.style.width = "100%";
        progressBar.style.background = "#22c55e"; // Hijau jika sukses
      }
    } catch (err) {
      if (progressBar) {
        progressBar.style.background = "#ef4444"; // Merah jika gagal
      }
      console.error("Upload Error:", err);
    }
    await delay(500); // Beri jeda singkat antar upload
  }
  isUploading = false;
}

// Event Listeners DOM
document.getElementById("pinCheckBtn").addEventListener("click", checkPin);
document.getElementById("pinCloseBtn").addEventListener("click", closePin);
document.getElementById("closeUploadBtn").addEventListener("click", closeUpload);
document.getElementById("closeEditPanelBtn").addEventListener("click", closeEditPanel);
document.getElementById("closeEditFormBottomBtn").addEventListener("click", closeEditForm);

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

[1, 2].forEach(i => {
  const input = document.getElementById(`image${i}`);
  if (input) {
    input.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        // Beri warna kuning tanda sedang mengantri/proses
        document.getElementById(`progress${i}`).style.width = "10%"; 
        document.getElementById(`progress${i}`).style.background = "#f59e0b"; 
        
        uploadQueue.push({ file: e.target.files[0], index: i - 1, mode: "upload" });
        processQueue();
      }
    });
  }
});

// --- Listener untuk Input Gambar di Menu Edit ---
const editImageInput = document.getElementById("editImage1");
if (editImageInput) {
  editImageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      // 1. Beri warna kuning pada progress bar edit
      const progressBar = document.getElementById("editProgress1");
      if (progressBar) {
        progressBar.style.width = "10%"; 
        progressBar.style.background = "#f59e0b"; 
      }
      
      // 2. Masukkan ke antrean dengan mode "edit"
      uploadQueue.push({ 
        file: e.target.files[0], 
        index: 0, 
        mode: "edit" 
      });
      
      // 3. Jalankan mesin upload
      processQueue();
    }
  });
}

// Edit List dengan stagger
function loadEditList() {
  const list = document.getElementById("editList");
  list.innerHTML = "";
  mods.forEach((mod, idx) => {
    const div = document.createElement("div");
    div.style.animationDelay = `${Math.min(idx * 0.05, 0.4)}s`;
    div.innerHTML = `
      <div style="margin-bottom:10px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="font-size:14px;">${mod.title}</strong><br>
          <span style="font-size:11px; color:var(--primary);">${mod.category}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="window.selectEdit(${idx})" style="padding:6px 12px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
          <button onclick="window.deleteMod(${idx})" style="padding:6px 12px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

// --- Fungsi untuk Reset Form & Progress Bar ---
function resetUploadForm() {
  // Reset Array Data
  uploadedImages = [null, null, null, null];
  uploadQueue = [];
  isUploading = false;

  // Reset Input File
  document.getElementById("image1").value = "";
  document.getElementById("image2").value = "";
  
  // Reset Text Input & Textarea
  document.getElementById("title").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("link").value = "";

  // Reset Visual Progress Bar
  [1, 2].forEach(i => {
    const bar = document.getElementById(`progress${i}`);
    if (bar) {
      bar.style.width = "0%";
      bar.style.background = "var(--primary)"; // Kembalikan ke warna biru
    }
  });
}

// --- Perbaikan Save Mod (Versi Final & Bersih) ---
document.getElementById("saveModBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const link = document.getElementById("link").value.trim();
  const desc = document.getElementById("desc").value.trim();
  const category = document.getElementById("category").value;
  
  // 1. Validasi Minimal 1 Gambar (Pesan Pemberitahuan)
  const hasImage = uploadedImages.some(img => img !== null);
  if (!hasImage) {
    alert("⚠️ Notifikasi: Kamu wajib mengupload minimal 1 gambar sebagai thumbnail!");
    return;
  }

  // 2. Validasi Input Form
  if (!title || !link || !desc) {
    alert("⚠️ Lengkapi semua data (Judul, Deskripsi, dan Link) sebelum publikasi!");
    return;
  }

  // 3. Proteksi Proses Upload yang Masih Berjalan
  if (isUploading || uploadQueue.length > 0) {
    alert("⏳ Tunggu sebentar, gambar masih dalam proses upload ke server...");
    return;
  }

  const overlay = document.getElementById("loadingOverlay");
  const success = document.getElementById("successPopup");
  
  overlay.style.display = "flex";

  try {
    await db.collection("mods").add({
      title: title,
      desc: desc,
      category: category,
      link: link,
      images: uploadedImages.filter(x => x !== null),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    overlay.style.display = "none";
    success.classList.add("show");
    success.style.display = "block";

    setTimeout(() => {
      success.classList.remove("show");
      success.style.display = "none";
      resetUploadForm(); // Reset semua state agar upload berikutnya lancar
      closeUpload();
    }, 2000);

  } catch (error) {
    overlay.style.display = "none";
    alert("Gagal mempublikasikan mod: " + error.message);
  }
});

window.selectEdit = function(index) {
  editIndex = index;
  const mod = mods[index];
  editUploadedImages = [null, null, null, null]; 
  document.getElementById("editProgress1").style.width = "0%";
  document.getElementById("editTitle").value = mod.title;
  document.getElementById("editDesc").value = mod.desc;
  document.getElementById("editCategory").value = mod.category;
  document.getElementById("editLink").value = mod.link;
  editPanel.classList.remove("active");
  openPanel(document.getElementById("editFormPanel"));
};

window.deleteMod = async function(index) {
  if (!auth.currentUser) return alert("Silakan login admin terlebih dahulu!");
  const mod = mods[index];
  if (!mod) return;
  if (confirm(`Hapus mod "${mod.title}" secara permanen?`)) {
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";
    try {
      await db.collection("mods").doc(mod.id).delete();
      alert("Mod berhasil dihapus!");
      loadEditList();
    } catch (error) {
      alert("Gagal menghapus mod: " + error.message);
    } finally {
      overlay.style.display = "none";
    }
  }
};

document.getElementById("updateModBtn").addEventListener("click", async () => {
  if (!isAdminLoggedIn || editIndex === null) return;
  const overlay = document.getElementById("loadingOverlay");
  overlay.style.display = "flex";
  const mod = mods[editIndex];
  let finalImages = [...mod.images];
  editUploadedImages.forEach((img, i) => { if (img !== null) finalImages[i] = img; });
  await db.collection("mods").doc(mod.id).update({
    title: document.getElementById("editTitle").value,
    desc: document.getElementById("editDesc").value,
    category: document.getElementById("editCategory").value,
    link: document.getElementById("editLink").value,
    images: finalImages,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  overlay.style.display = "none";
  closePanel(document.getElementById("editFormPanel"));
  alert("Berhasil diupdate!");
});
