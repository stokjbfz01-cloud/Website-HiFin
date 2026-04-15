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
  check.innerText = "✅";
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

function updateDetailImage() { detailImg.src = currentImages[currentIndex]; }
function closeMenu() { menuPanel.style.display = "none"; }
function closeUpload() { uploadPanel.style.display = "none"; menuPanel.style.display = "block"; }
function closeEditPanel() { editPanel.style.display = "none"; menuPanel.style.display = "block"; }
function closeEditForm() { editFormPanel.style.display = "none"; editPanel.style.display = "block"; editIndex = null; }
function openPin() { pinPanel.style.display = "block"; }
function closePin() { pinPanel.style.display = "none"; }
function openUploadDirect() { uploadPanel.style.display = "block"; }
function openUpload() { menuPanel.style.display = "none"; uploadPanel.style.display = "block"; }
function openEdit() { menuPanel.style.display = "none"; editPanel.style.display = "block"; loadEditList(); }

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
  const fragment = document.createDocumentFragment();
  data.forEach(mod => fragment.appendChild(createCard(mod)));
  modsList.innerHTML = "";
  modsList.appendChild(fragment);
}

function createCard(mod) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="thumb">
      <img loading="lazy" decoding="async" src="${mod.images[0] || 'https://via.placeholder.com/300x169?text=No+Image'}" onload="this.style.opacity=1" onerror="this.src='https://via.placeholder.com/300x169?text=Error'" style="opacity:0; transition:0.3s;">
    </div>
    <div class="card-content">
      <span class="badge">${mod.category}</span>
      <h4 style="margin:5px 0">${mod.title}</h4>
      <p style="font-size:12px; color:#666">${mod.desc}</p>
      <button class="download-btn" data-index="${mods.indexOf(mod)}">View</button>
    </div>
  `;
  return card;
}

function openDetail(index) {
  const mod = mods[index];
  detailPanel.style.display = "block";
  detailPanel.scrollTop = 0;
  window.scrollTo(0, 0);
  currentImages = mod.images;
  currentIndex = 0;
  updateDetailImage();
  detailTitle.innerText = mod.title;
  detailTitleTop.innerText = mod.title;
  detailDesc.innerText = mod.desc;
  detailCategorySpan.innerText = mod.category;
  const detailDownloadSmall = document.getElementById("detailDownloadSmall");
  detailDownloadSmall.onclick = () => window.open(mod.link);
}

function checkPin() {
  const pin = pinInput.value;
  pinPanel.style.display = "none";
  menuPanel.style.display = "block";
  menuButtons.innerHTML = "";
  if (pin === "089514") {
    menuTitle.innerText = "Menu Developer";
    menuButtons.innerHTML = `
      <button id="uploadModBtn">Upload Mod</button>
      <button id="editModBtn">Edit Mod</button>
      <button id="closeMenuBtn" style="background:#ccc;color:#333;">Tutup</button>
    `;
    document.getElementById("uploadModBtn").addEventListener("click", openUpload);
    document.getElementById("editModBtn").addEventListener("click", openEdit);
    document.getElementById("closeMenuBtn").addEventListener("click", closeMenu);
  } else {
    alert("PIN salah!");
    pinPanel.style.display = "block";
    menuPanel.style.display = "none";
  }
}

async function saveMod() {
  if (uploadedImages.every(img => img === null)) return alert("Upload gambar dulu!");
  loadingOverlay.style.display = "flex";
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
  setTimeout(() => successPopup.style.display = "none", 3000);
  uploadedImages = [null, null, null, null];
  uploadPanel.style.display = "none";
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
  editPanel.style.display = "none";
  editFormPanel.style.display = "block";
}

async function updateMod() {
  if (editIndex === null) return alert("Pilih mod dulu!");
  loadingOverlay.style.display = "flex";
  const mod = mods[editIndex];
  let finalImages = [...mod.images];
  editUploadedImages.forEach((img, i) => { if (img !== null) finalImages[i] = img; });
  await db.collection("mods").doc(mod.id).update({
    title: editTitle.value,
    desc: editDesc.value,
    category: editCategory.value,
    link: editLink.value,
    images: finalImages,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  loadingOverlay.style.display = "none";
  successPopup.style.display = "block";
  successPopup.style.transform = "translate(-50%, -50%) scale(1)";
  setTimeout(() => successPopup.style.display = "none", 3000);
  editUploadedImages = [null, null, null, null];
  closeEditForm();
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
  // Logo
  document.querySelector(".logo").addEventListener("click", openPin);
  // Upload button header
  document.querySelector(".upload-btn").addEventListener("click", openUploadDirect);
  // Pin panel buttons
  document.getElementById("pinCheckBtn").addEventListener("click", checkPin);
  document.getElementById("pinCloseBtn").addEventListener("click", closePin);
  // Save & close upload
  document.getElementById("saveModBtn").addEventListener("click", saveMod);
  document.getElementById("closeUploadBtn").addEventListener("click", closeUpload);
  // Edit panel buttons
  document.getElementById("closeEditPanelBtn").addEventListener("click", closeEditPanel);
  document.getElementById("closeEditFormBtn").addEventListener("click", closeEditForm);
  document.getElementById("closeEditFormBottomBtn").addEventListener("click", closeEditForm);
  document.getElementById("updateModBtn").addEventListener("click", updateMod);
  // Detail panel back button
  document.getElementById("detailBackBtn").addEventListener("click", () => detailPanel.style.display = "none");
  document.getElementById("prevImgBtn").addEventListener("click", prevImg);
  document.getElementById("nextImgBtn").addEventListener("click", nextImg);
  // Category filters
  document.querySelectorAll(".cat").forEach(el => {
    el.addEventListener("click", () => {
      currentCategory = el.dataset.cat;
      document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      applyFilter();
    });
  });
  // Search input
  search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilter, 150);
  });
  // File uploads for upload panel
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
  // File uploads for edit panel
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
  // Event delegation for View buttons in modsList
  modsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("download-btn")) {
      const idx = parseInt(e.target.dataset.index);
      openDetail(idx);
    }
  });
  // Close detail panel when clicking outside content (optional)
  detailPanel.addEventListener("click", (e) => {
    if (!document.getElementById("detailContent").contains(e.target)) {
      e.stopPropagation();
    }
  });
  // Initial load and intro
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelector(".main").style.display = "none";
      document.getElementById("app").classList.add("show");
      loadModsRealtime();
    }, 5500);
  });
});
