// Firebase Config
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

// Global variables
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
let appReady = false;
let isAdminLoggedIn = false;

// DOM elements
const pinPanel = document.getElementById("pinPanel");
const menuPanel = document.getElementById("menuPanel");
const uploadPanel = document.getElementById("uploadPanel");
const editPanel = document.getElementById("editPanel");
const editFormPanel = document.getElementById("editFormPanel");
const detailPanel = document.getElementById("detailPanel");
const modsList = document.getElementById("modsList");
const search = document.getElementById("search");
const loadingOverlay = document.getElementById("loadingOverlay");
const successPopup = document.getElementById("successPopup");
const editList = document.getElementById("editList");
const pinInput = document.getElementById("pinInput");
const menuButtons = document.getElementById("menuButtons");
const menuTitle = document.getElementById("menuTitle");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("desc");
const categorySelect = document.getElementById("category");
const linkInput = document.getElementById("link");
const editTitle = document.getElementById("editTitle");
const editDesc = document.getElementById("editDesc");
const editCategory = document.getElementById("editCategory");
const editLink = document.getElementById("editLink");
const detailTitleTop = document.getElementById("detailTitleTop");
const detailTitle = document.getElementById("detailTitle");
const detailDesc = document.getElementById("detailDesc");
const detailCategorySpan = document.getElementById("detailCategory");
const detailImg = document.getElementById("detailImg");
const previewImagesDiv = document.getElementById("previewImages");
const editPreviewImagesDiv = document.getElementById("editPreviewImages");

// Helper functions
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Hifin_Web");
  const res = await fetch("https://api.cloudinary.com/v1_1/dvch9imk2/image/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload gagal");
  return data.secure_url;
}

async function processQueue(type = "upload") {
  if (isUploading) return;
  isUploading = true;
  while (uploadQueue.length > 0) {
    const { file, index, mode } = uploadQueue.shift();
    const barId = (mode === "edit" ? "editProgress" : "progress") + (index + 1);
    const textId = (mode === "edit" ? "editProgressText" : "progressText") + (index + 1);
    document.getElementById(textId).innerText = "Uploading...";
    try {
      const url = await uploadImage(file);
      if (mode === "edit") editUploadedImages[index] = url;
      else uploadedImages[index] = url;
      const container = mode === "edit" ? "#editPreviewImages" : "#previewImages";
      document.querySelectorAll(container + " > div").forEach(w => {
        if (parseInt(w.dataset.index) === index && w.dataset.mode === mode) {
          const check = w.querySelector("div:last-child");
          if (check) check.style.display = "block";
        }
      });
      document.getElementById(barId).style.width = "100%";
      document.getElementById(textId).innerText = "100%";
    } catch (err) {
      document.getElementById(textId).innerText = "Error";
    }
    await delay(1000);
  }
  isUploading = false;
  const saveBtn = document.getElementById("saveModBtn");
  const updateBtn = document.getElementById("updateModBtn");
  if (saveBtn) saveBtn.disabled = !uploadedImages.some(x => x !== null) || isUploading;
  if (updateBtn) updateBtn.disabled = isUploading;
}

function previewImage(input, index, mode = "upload") {
  const preview = mode === "edit" ? editPreviewImagesDiv : previewImagesDiv;
  const file = input.files[0];
  if (!file) return;
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  const img = document.createElement("img");
  img.style.width = "60px";
  img.style.height = "60px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "6px";
  img.src = URL.createObjectURL(file);
  const check = document.createElement("div");
  check.innerText = "✓";
  check.style.position = "absolute";
  check.style.top = "2px";
  check.style.right = "2px";
  check.style.fontSize = "16px";
  check.style.display = "none";
  wrapper.appendChild(img);
  wrapper.appendChild(check);
  preview.appendChild(wrapper);
  wrapper.dataset.index = index;
  wrapper.dataset.mode = mode;
}

function updateDetailImage() { 
  if (currentImages && currentImages[currentIndex]) {
    const rawUrl = currentImages[currentIndex];
    // Gunakan weserv.nl agar gambar diproses menjadi WebP dan melewati filter CSP dengan aman
    const optimizedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}&w=800&fit=cover&output=webp&q=85`;
    
    detailImg.src = optimizedUrl;
    
    // Opsional: Berikan efek loading saat gambar berganti
    detailImg.style.opacity = "0.5";
    detailImg.onload = () => { detailImg.style.opacity = "1"; };
  }
}
function openPin() {
  openPanel(pinPanel);
}

function closePin() {
  closePanel(pinPanel);
}

function openPanel(panel) {
  panel.classList.add("active");
  lockScroll();
}

function closePanel(panel) {
  panel.classList.remove("active");
  unlockScroll();
}

function closeMenu() {
  closePanel(menuPanel);
}

function openUploadDirect() {
  openPanel(uploadPanel);
}

function openUpload() {
  closePanel(menuPanel);
  openPanel(uploadPanel);
}

function closeUpload() {
  closePanel(uploadPanel);
}

function openEdit() {
  closePanel(menuPanel);
  openPanel(editPanel);
  loadEditList();
}

function closeEditPanel() {
  closePanel(editPanel);
}

function closeEditForm() {
  editFormPanel.classList.remove("active");
  editPanel.classList.add("active");
  editIndex = null;
}

function nextImg() {
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateDetailImage();
}
function prevImg() {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateDetailImage();
}

function applyFilter() {
  let filtered = mods;
  if (currentCategory !== "ALL") filtered = filtered.filter(m => m.category === currentCategory);
  const keyword = search.value.toLowerCase();
  filtered = filtered.filter(m => m.title.toLowerCase().includes(keyword) || m.desc.toLowerCase().includes(keyword));
  renderMods(filtered);
}

function renderMods(data) {
  // Gunakan Fast-Path Rendering
  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();
    
    // Batasi render awal hanya untuk yang terlihat (jika data sangat banyak)
    data.forEach(mod => {
      fragment.appendChild(createCard(mod));
    });

    // Operasi DOM tunggal untuk meminimalisir reflow
    modsList.innerHTML = "";
    modsList.appendChild(fragment);
    
    // Force GPU untuk memproses layer baru
    modsList.style.transform = 'translateZ(0)';
  });
}

function createCard(mod) {
  const card = document.createElement("div");
  card.className = "card";
  
  // Menggunakan weserv.nl sebagai Cache Proxy & Image Optimizer
  // Ini akan mengubah gambar ke WebP secara realtime dan meng-cache di CDN
  const optimizedThumb = `https://images.weserv.nl/?url=${encodeURIComponent(mod.images[0])}&w=400&h=225&fit=cover&output=webp&q=80`;

  card.innerHTML = `
    <div class="thumb" style="background: #2c2c2c;">  
      <img loading="eager" 
           decoding="sync"  
           src="${optimizedThumb}"  
           onload="this.style.opacity=1"  
           style="opacity:0; width:100%; height:100%; object-fit:cover;">  
    </div>
    <div class="card-content">  
      <span class="badge">${mod.category}</span>  
      <h4 class="card-title">${mod.title}</h4>  
      <p style="font-size:12px; color:#666">${mod.desc}</p>  
      <button class="download-btn btn-text" data-index="${mods.indexOf(mod)}">SELENGKAPNYA</button>  
    </div>  
  `;
  return card;
}


function openDetail(index) {
  const mod = mods[index];
  if (!mod) return;

  // Pastikan images adalah array, jika tidak ada gunakan array kosong
  currentImages = Array.isArray(mod.images) ? mod.images : (mod.image ? [mod.image] : []);
  
  if (currentImages.length > 0) {
    currentIndex = 0;
    updateDetailImage();
  } else {
    detailImg.src = ""; // Clear jika tidak ada gambar
  }

  detailTitle.innerText = mod.title;
  detailTitleTop.innerText = mod.title;
  detailDesc.innerText = mod.desc;
  detailCategorySpan.innerText = mod.category;

  const detailDownloadSmall = document.getElementById("detailDownloadSmall");
  detailDownloadSmall.onclick = () => window.open(mod.link);

  detailPanel.classList.add("active");
  detailPanel.scrollTop = 0;
  lockScroll();
}

function checkPin() {
  const pin = pinInput.value;
  if (pin === "089514") {
    // Selalu buka menuPanel dulu
    openPanel(menuPanel);  
    
    // Cek status login
    if (isAdminLoggedIn) {  
      showDeveloperMenu();  
    } else {  
      menuTitle.innerText = "Panel - Login Developer🧩";  
      menuButtons.innerHTML = `  
        <button id="loginBtn">Login Admin</button>  
        <button id="closeMenuBtn" style="background:#ccc;color:#333;">Tutup</button>  
      `;  
      document.getElementById("loginBtn").onclick = loginAdmin;  
      document.getElementById("closeMenuBtn").onclick = closeMenu;  
    }
    // Kosongkan input pin setelah berhasil
    pinInput.value = "";
    closePanel(pinPanel);
  } else {
    alert("PIN salah!");
  }
}

async function saveMod() {
  if (uploadedImages.every(img => img === null)) return alert("Upload gambar dulu!");
  
  loadingOverlay.style.display = "flex";
  
  try {
    await db.collection("mods").add({
      title: titleInput.value,
      desc: descInput.value,
      category: categorySelect.value,
      link: linkInput.value,
      images: uploadedImages.filter(x => x),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    loadingOverlay.style.display = "none";
    successPopup.style.display = "block";
    successPopup.style.transform = "translateX(-50%) scale(1)";
    
    setTimeout(() => {
      successPopup.style.display = "none";
    }, 3000);

    // --- PERBAIKAN DI SINI ---
    // 1. Reset data upload
    uploadedImages = [null, null, null, null];
    titleInput.value = "";
    descInput.value = "";
    linkInput.value = "";
    previewImagesDiv.innerHTML = "";
    document.querySelectorAll(".progress-bar").forEach(b => b.style.width = "0%");
    document.querySelectorAll("[id^='progressText']").forEach(t => t.innerText = "0%");

    // 2. Tutup semua panel menggunakan fungsi yang sudah ada
    closePanel(uploadPanel);
    closePanel(menuPanel);
    closePanel(editPanel);
    closePanel(editFormPanel);
    
    // Pastikan scroll kembali normal
    unlockScroll();

  } catch (error) {
    loadingOverlay.style.display = "none";
    alert("Gagal menyimpan: " + error.message);
  }
}

function loadEditList() {
  editList.innerHTML = "";
  mods.forEach((mod, idx) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div style="margin-bottom:10px; padding:10px; border:1px solid #ddd; border-radius:8px;">
        <b>${mod.title}</b><br>
        <small>${mod.category}</small><br>
        <button class="editItemBtn" data-index="${idx}">Edit</button>
        <button class="deleteItemBtn" data-index="${idx}">Hapus</button>
      </div>
    `;
    editList.appendChild(div);
  });
  document.querySelectorAll(".editItemBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.dataset.index);
      selectEdit(idx);
    });
  });
  document.querySelectorAll(".deleteItemBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const idx = parseInt(btn.dataset.index);
      if (confirm("Yakin mau hapus mod ini?")) {
        const user = firebase.auth().currentUser;
        if (!user || user.email !== "stokjbfz01@gmail.com") {
          return alert("Hanya admin yang bisa hapus!");
        }
        await db.collection("mods").doc(mods[idx].id).delete();
        alert("Mod berhasil dihapus!");
        loadModsRealtime();
        loadEditList();
      }
    });
  });
}

function selectEdit(index) {
  editIndex = index;
  const mod = mods[index];
  editTitle.value = mod.title;
  editDesc.value = mod.desc;
  editCategory.value = mod.category;
  editLink.value = mod.link;
  
  // Gunakan fungsi panel yang sudah ada agar konsisten
  closePanel(editPanel);
  openPanel(editFormPanel);
}

async function updateMod() {
  const user = firebase.auth().currentUser;
  if (!user || user.email !== "stokjbfz01@gmail.com") {
    return alert("Hanya admin yang bisa edit!");
  }
  if (editIndex === null) return alert("Pilih mod dulu!");
  
  loadingOverlay.style.display = "flex";
  
  try {
    const mod = mods[editIndex];
    let finalImages = [...mod.images];
    
    // Update hanya gambar yang baru diupload
    editUploadedImages.forEach((img, i) => {
      if (img !== null) finalImages[i] = img;
    });

    await db.collection("mods").doc(mod.id).update({
      title: editTitle.value,
      desc: editDesc.value,
      category: editCategory.value,
      link: editLink.value,
      images: finalImages,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    loadingOverlay.style.display = "none";
    
    // Tampilkan feedback sukses
    successPopup.style.display = "block";
    successPopup.style.transform = "translateX(-50%) scale(1)";
    
    setTimeout(() => {
      successPopup.style.display = "none";
    }, 2000);

    // RESET & KEMBALI KE MENU DEVELOPER
    editUploadedImages = [null, null, null, null];
    editIndex = null;
    
    // Sembunyikan panel form edit
    closePanel(editFormPanel); 
    // Tampilkan kembali panel menu utama developer
    openPanel(menuPanel);
    showDeveloperMenu(); 

  } catch (error) {
    loadingOverlay.style.display = "none";
    alert("Gagal update: " + error.message);
  }
}

function loadModsRealtime() {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("mods").orderBy("updatedAt", "desc").onSnapshot(snapshot => {
    mods = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      mods.push({
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt || data.createdAt || 0,
        images: data.images || [data.image]
      });
    });
    applyFilter();
  }, err => console.error("Firestore error:", err));
}

// Event Listeners (DOM sudah siap)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".logo").addEventListener("click", openPin);
  document.querySelector(".upload-btn").addEventListener("click", openUploadDirect);
  document.getElementById("pinCheckBtn").addEventListener("click", checkPin);
  document.getElementById("pinCloseBtn").addEventListener("click", closePin);
  document.getElementById("saveModBtn").addEventListener("click", saveMod);
  document.getElementById("closeUploadBtn").addEventListener("click", closeUpload);
  document.getElementById("closeEditPanelBtn").addEventListener("click", closeEditPanel);
  document.getElementById("closeEditFormBtn").addEventListener("click", closeEditForm);
  document.getElementById("closeEditFormBottomBtn").addEventListener("click", closeEditForm);
  document.getElementById("updateModBtn").addEventListener("click", updateMod);
  document.getElementById("detailBackBtn").addEventListener("click", () => {
    detailPanel.classList.remove("active");
    unlockScroll();
  });
  document.getElementById("prevImgBtn").addEventListener("click", prevImg);
  document.getElementById("nextImgBtn").addEventListener("click", nextImg);
  document.querySelectorAll(".cat").forEach(el => {
    el.addEventListener("click", () => {
      currentCategory = el.dataset.cat;
      document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      applyFilter();
    });
  });
  search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilter, 150);
  });
  document.getElementById("image1").addEventListener("change", (e) => {
    previewImage(e.target, 0, "upload");
    uploadQueue.push({ file: e.target.files[0], index: 0, mode: "upload" });
    processQueue();
  });
  document.getElementById("image2").addEventListener("change", (e) => {
    previewImage(e.target, 1, "upload");
    uploadQueue.push({ file: e.target.files[0], index: 1, mode: "upload" });
    processQueue();
  });
  document.getElementById("image3").addEventListener("change", (e) => {
    previewImage(e.target, 2, "upload");
    uploadQueue.push({ file: e.target.files[0], index: 2, mode: "upload" });
    processQueue();
  });
  document.getElementById("image4").addEventListener("change", (e) => {
    previewImage(e.target, 3, "upload");
    uploadQueue.push({ file: e.target.files[0], index: 3, mode: "upload" });
    processQueue();
  });
  document.getElementById("editImage1").addEventListener("change", (e) => {
    previewImage(e.target, 0, "edit");
    uploadQueue.push({ file: e.target.files[0], index: 0, mode: "edit" });
    processQueue();
  });
  document.getElementById("editImage2").addEventListener("change", (e) => {
    previewImage(e.target, 1, "edit");
    uploadQueue.push({ file: e.target.files[0], index: 1, mode: "edit" });
    processQueue();
  });
  document.getElementById("editImage3").addEventListener("change", (e) => {
    previewImage(e.target, 2, "edit");
    uploadQueue.push({ file: e.target.files[0], index: 2, mode: "edit" });
    processQueue();
  });
  document.getElementById("editImage4").addEventListener("change", (e) => {
    previewImage(e.target, 3, "edit");
    uploadQueue.push({ file: e.target.files[0], index: 3, mode: "edit" });
    processQueue();
  });
  modsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("download-btn")) {
      const idx = parseInt(e.target.dataset.index);
      openDetail(idx);
    }
  });
  detailPanel.addEventListener("click", (e) => {
    if (!document.getElementById("detailContent").contains(e.target)) {
      e.stopPropagation();
    }
  });
  window.addEventListener("load", () => {
    lockScroll();
    detailPanel.classList.remove("active");
    editPanel.classList.remove("active");
    editFormPanel.classList.remove("active");
    uploadPanel.classList.remove("active");
    menuPanel.classList.remove("active");
    setTimeout(() => {
      document.querySelector(".main").style.display = "none";
      document.getElementById("app").classList.add("show");
      loadModsRealtime();
      appReady = true;
      unlockScroll();
    }, 5500);
  });
});

function lockScroll() {
  document.body.classList.add("no-scroll");
}

function unlockScroll() {
  document.body.classList.remove("no-scroll");
}

function loginAdmin() {
  const email = prompt("Masukkan email admin:");
  const password = prompt("Masukkan password:");
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login berhasil, silakan masukkan PIN lagi");
      closeMenu();
    })
    .catch(() => {
      alert("Login gagal");
    });
}

function showDeveloperMenu() {
  menuTitle.innerText = "Menu Developer";
  menuButtons.innerHTML = `
    <button id="uploadModBtn">Upload Mod</button>
    <button id="editModBtn">Edit Mod</button>
    <button id="logoutBtn">Logout</button>
    <button id="closeMenuBtn" style="background:#ccc;color:#333;">Tutup</button>
  `;
  document.getElementById("uploadModBtn").addEventListener("click", openUpload);
  document.getElementById("editModBtn").addEventListener("click", openEdit);
  document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());
  document.getElementById("closeMenuBtn").addEventListener("click", closeMenu);
}

auth.onAuthStateChanged(user => {
  if (user && user.email === "stokjbfz01@gmail.com") {
    isAdminLoggedIn = true;
    console.log("Admin login tersimpan");
  } else {
    isAdminLoggedIn = false;
  }
  menuPanel.classList.remove("active");
});
