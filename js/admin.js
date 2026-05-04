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

const modsListDiv = document.getElementById('modsListAdmin');
const editModal = document.getElementById('editModal');

let mods = [];
let currentEditId = null;
let uploadQueue = [];
let isUploading = false;
let uploadedImages = [null, null];
let editUploadedImages = [null, null];

// Auth State
auth.onAuthStateChanged(user => {
  if (user && user.email === "stokjbfz01@gmail.com") {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadMods();
  } else {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('adminEmail').value;
  const pwd = document.getElementById('adminPassword').value;
  auth.signInWithEmailAndPassword(email, pwd).catch(err => alert(err.message));
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

function loadMods() {
  db.collection('mods').orderBy('updatedAt', 'desc').onSnapshot(snap => {
    mods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMods();
  });
}

function renderMods() {
  modsListDiv.innerHTML = '';
  mods.forEach(mod => {
    const div = document.createElement('div');
    div.className = 'mod-item';
    div.innerHTML = `
      <div class="mod-info">
        <h4><span class="category-badge">${mod.category}</span>${mod.title}</h4>
        <p style="font-size:12px; color:var(--text-muted);">${(mod.desc || '').substring(0,60)}...</p>
      </div>
      <div class="mod-actions">
        <button class="btn-warning" onclick="openEditModal('${mod.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-danger" onclick="deleteMod('${mod.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    modsListDiv.appendChild(div);
  });
}

// Cloudinary Logic
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Hifin_Web');
  const res = await fetch('https://api.cloudinary.com/v1_1/dvch9imk2/image/upload', { method: 'POST', body: formData });
  const data = await res.json();
  return data.secure_url;
}

async function processQueue(isEdit = false) {
  if (isUploading) return;
  isUploading = true;
  while (uploadQueue.length > 0) {
    const { file, index } = uploadQueue.shift();
    const pfx = isEdit ? 'editProgress' : 'progress';
    const bar = document.getElementById(`${pfx}${index+1}`);
    try {
      const url = await uploadImage(file);
      if(isEdit) editUploadedImages[index] = url;
      else uploadedImages[index] = url;
      if(bar) { bar.style.width = '100%'; bar.style.background = '#10b981'; }
    } catch (e) { console.error(e); }
  }
  isUploading = false;
}

// Input Listeners
document.getElementById('image1').onchange = e => handleFile(e, 0, false);
document.getElementById('image2').onchange = e => handleFile(e, 1, false);
document.getElementById('editImgInput1').onchange = e => handleFile(e, 0, true);
document.getElementById('editImgInput2').onchange = e => handleFile(e, 1, true);

function handleFile(e, idx, isEdit) {
  if (e.target.files[0]) {
    const pfx = isEdit ? 'editProgress' : 'progress';
    document.getElementById(`${pfx}${idx+1}`).style.width = '30%';
    uploadQueue.push({ file: e.target.files[0], index: idx });
    processQueue(isEdit);
  }
}

// Modal Controls
window.openEditModal = (id) => {
  const mod = mods.find(m => m.id === id);
  if (!mod) return;
  currentEditId = id;
  document.getElementById('editTitle').value = mod.title;
  document.getElementById('editDesc').value = mod.desc;
  document.getElementById('editCategory').value = mod.category;
  document.getElementById('editLink').value = mod.link;
  editUploadedImages = [...(mod.images || [null, null])];
  
  // Reset Progress Bars
  document.getElementById('editProgress1').style.width = '0%';
  document.getElementById('editProgress2').style.width = '0%';
  document.getElementById('editImgInput1').value = '';
  document.getElementById('editImgInput2').value = '';
  
  editModal.style.display = 'flex';
};

window.closeEditModal = () => { editModal.style.display = 'none'; currentEditId = null; };

// Update Logic
document.getElementById('updateModBtn').onclick = async () => {
  if (isUploading) return alert("Tunggu upload selesai!");
  const modData = {
    title: document.getElementById('editTitle').value,
    desc: document.getElementById('editDesc').value,
    category: document.getElementById('editCategory').value,
    link: document.getElementById('editLink').value,
    images: editUploadedImages.filter(i => i !== null),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('mods').doc(currentEditId).update(modData);
  alert("Berhasil diupdate!");
  closeEditModal();
};

// Save New Logic
document.getElementById('saveModBtn').onclick = async () => {
  const title = document.getElementById('title').value;
  if (!title || !uploadedImages[0]) return alert("Lengkapi data!");
  await db.collection('mods').add({
    title, desc: document.getElementById('desc').value,
    category: document.getElementById('category').value,
    link: document.getElementById('link').value,
    images: uploadedImages.filter(i => i !== null),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert("Mod Dipublikasikan!");
  location.reload();
};

window.deleteMod = async (id) => {
  if (confirm("Hapus permanen?")) await db.collection('mods').doc(id).delete();
};
