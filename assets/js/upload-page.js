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
const storage = firebase.storage();

        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        dark: { 900: '#09090b', 800: '#121216', 700: '#1c1c22', 600: '#272730' },
                        brand: { red: '#e52525', glow: '#ff4b4b', dark: '#8a1010' }
                    },
                    fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Poppins', 'sans-serif'] },
                    boxShadow: {
                        'glow-red': '0 0 20px rgba(229, 37, 37, 0.3)',
                        'glow-green': '0 0 20px rgba(34, 197, 94, 0.4)',
                    }
                }
            }
        }

let currentStep = 1;
const totalSteps = 4;
let uploadedImages = [null, null, null, null]; // 4 fixed slots
let modFeatures = []; // Dynamic Features Array

/* ======================== NAVIGATION LOGIC ======================== */
function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const progressIndicator = document.getElementById('progress-indicator');
    if (progressIndicator) progressIndicator.style.width = progress + '%';
    
    document.querySelectorAll('.step-node').forEach(node => {
        const nodeStep = parseInt(node.getAttribute('data-step'));
        const icon = node.querySelector('div');
        const label = node.querySelector('span');
        
        if (!icon || !label) return; // Tambahkan keamanan ini

        if (nodeStep < currentStep) {
            icon.className = "w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-dark-900 shadow-glow-green transition-all duration-300 scale-95";
            icon.innerHTML = '<i class="fa-solid fa-check"></i>';
            label.className = "text-[9px] font-medium text-green-500 transition-colors";
        } else if (nodeStep === currentStep) {
            icon.className = "w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold ring-4 ring-dark-900 shadow-glow-red transition-all duration-300 scale-110";
            icon.innerHTML = nodeStep;
            label.className = "text-[9px] font-medium text-brand-red transition-colors";
        } else {
            icon.className = "w-8 h-8 rounded-full bg-dark-800 text-gray-500 flex items-center justify-center text-xs font-bold ring-4 ring-dark-900 transition-all duration-300";
            icon.innerHTML = nodeStep;
            label.className = "text-[9px] font-medium text-gray-500 transition-colors";
        }
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtnText = document.querySelector('#nextBtn span');
    const nextBtnIcon = document.getElementById('btnIcon');

    // Gunakan conditional check (if) agar tidak error saat elemen null
    if (prevBtn) {
        if (currentStep === 1 || currentStep === totalSteps) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
    }

    if (nextBtnText && nextBtnIcon) {
        if (currentStep === 3) {
            nextBtnText.innerText = 'Publish';
            nextBtnIcon.className = "fa-solid fa-paper-plane text-xs";
        } else {
            nextBtnText.innerText = 'Berikutnya';
            nextBtnIcon.className = "fa-solid fa-arrow-right text-xs";
        }
    }
    
    // Sembunyikan footer jika sudah di tahap Finis (Step 4)
    const footer = document.querySelector('footer');
    if (footer) {
        if (currentStep === 4) footer.classList.add('hidden');
        else footer.classList.remove('hidden');
    }
}

function goBackStep() {
    if (currentStep > 1) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgress();
    }
}

// Cari fungsi nextStep() yang lama dan ganti dengan ini:
function nextStep() {
    // Validasi Step 1
    if (currentStep === 1) {
        const nameInput = document.getElementById('modName');
        if (!nameInput.value.trim()) {
            nameInput.classList.add('border-brand-red', 'shadow-glow-red');
            document.getElementById('errName').classList.remove('hidden');
            return;
        }
    }

    // Validasi Step 2
    if (currentStep === 2) {
        const hasImage = uploadedImages.some(img => img !== null);
        if (!hasImage) {
            showToast("Wajib upload minimal 1 gambar review!");
            return;
        }
        updatePreview();
    }

    // LOGIKA KRUSIAL: Jika di Step 3 (Preview) dan klik 'Publish'
    if (currentStep === 3) {
        publishMod(); // Panggil fungsi upload ke Firebase di sini!
        return; // Jangan lanjut ke currentStep++ dulu, biarkan publishMod yang handle
    }

    // Move to Next (untuk step 1 ke 2, atau 2 ke 3)
    if (currentStep < totalSteps) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgress();
    }
}

/* ======================== DYNAMIC FEATURES LOGIC ======================== */
function toggleFeatureInput() {
    const container = document.getElementById('feature-input-container');
    container.classList.toggle('hidden');
    if(!container.classList.contains('hidden')) {
        document.getElementById('featureInput').focus();
    }
}

function saveFeature() {
    const inputEl = document.getElementById('featureInput');
    const val = inputEl.value.trim();
    if(val !== '') {
        modFeatures.push(val);
        renderFeatures();
        inputEl.value = ''; // clear input
    }
}

function removeFeature(index) {
    modFeatures.splice(index, 1);
    renderFeatures();
}

function renderFeatures() {
    const list = document.getElementById('feature-list');
    list.innerHTML = '';
    modFeatures.forEach((feat, index) => {
        const chip = document.createElement('div');
        chip.className = "flex items-center gap-2 bg-brand-red/20 border border-brand-red text-brand-red px-3 py-1.5 rounded-xl text-[11px] font-medium pop-in";
        chip.innerHTML = `
            <span>${feat}</span>
            <button onclick="removeFeature(${index})" class="text-brand-red hover:text-white transition-colors ml-1 btn-active"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(chip);
    });
}

/* ======================== IMAGE UPLOAD & PROGRESS LOGIC ======================== */
function handleSlotUpload(inputEl, index) {
    const file = inputEl.files[0];
    if (!file) return;

    // Validasi ukuran (karena Base64 berat di database, batasi misal 800KB)
if (file.size > 1000000) {
    showToast("Gambar terlalu besar! Maksimal 150KB per slot");
    inputEl.value = "";
    return;
}


    const progressBar = document.getElementById(`progress-slot-${index}`);
    const label = document.getElementById(`label-slot-${index}`);
    const imgEl = document.getElementById(`img-slot-${index}`);
    const delBtn = document.getElementById(`del-slot-${index}`);
    const container = document.getElementById(`slot-container-${index}`);

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        
        // Simpan Base64 ke array state
        uploadedImages[index] = base64Data;

        // UI Update
        imgEl.src = base64Data;
        imgEl.classList.remove('hidden');
        label.classList.add('hidden');
        delBtn.classList.remove('hidden');
        container.classList.add('slot-success');
        
        // Simulasi progress selesai karena Base64 instan secara lokal
        progressBar.style.width = "100%";
        progressBar.style.background = "#4ade80";
    };
    reader.readAsDataURL(file);
}

async function publishMod() {
    // Ambil semua value input
    const title = document.getElementById('modName').value;
    const version = document.getElementById('modVersion').value || "v1.0";
    const category = document.getElementById('modCategory').value;
    const desc = document.getElementById('modDesc').value;
    const link = document.getElementById('modLink').value;
    const size = document.getElementById('modSize').value || "0 MB";

    const btn = document.getElementById('nextBtn');
    const images = uploadedImages.filter(img => img !== null);

    // Persiapan UI Loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';

    try {
        // 1. Cek Pengaturan Approval dari Firestore (Membaca kondisi tombol di admin.html)
        const settingsDoc = await db.collection("settings").doc("global").get();
        let isApprovalRequired = true; 
        
        if (settingsDoc.exists) {
            // Mengambil nilai approvalRequired dari database
            isApprovalRequired = settingsDoc.data().approvalRequired;
        }

        // Jika isApprovalRequired = false (dimatikan), maka status = "approved"
        // Jika isApprovalRequired = true (dinyalakan), maka status = "pending"
        const finalStatus = isApprovalRequired ? "pending" : "approved";

        // 2. Simpan Data Mod ke Firestore
        const modRef = await db.collection("mods").add({
    title: title,
    version: version,
    category: category,
    desc: desc,
    link: link,
    size: size,
    features: modFeatures,
    images: images,
    status: finalStatus,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // ✅ Tambahkan ini
});

        // 3. LOGIKA ADAPTIF WARNA & ICON (Update UI Step 4 secara visual)
        const successMsgEl = document.getElementById('successMessage');
        const successTitleEl = document.getElementById('successTitle');
        const iconContainer = document.getElementById('successIconContainer');
        const iconIcon = document.getElementById('successIcon');

        if (finalStatus === "pending") {
            // Tampilan JIKA BUTUH REVIEW (Kuning/Amber)
            successTitleEl.innerText = "Menunggu Persetujuan";
            successMsgEl.innerText = "Mod berhasil terkirim. Admin akan meninjau mod kamu segera.";
            iconContainer.className = "w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-bounce";
            iconIcon.className = "fa-solid fa-clock-rotate-left";

            // Kirim notif ke admin bahwa ada mod yang butuh di-approve
            await db.collection("notifications").add({
                type: "approval_request",
                modId: modRef.id,
                modTitle: title,
                message: `User mengunggah mod baru: ${title}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        } else {
            // Tampilan JIKA LANGSUNG PUBLISH (Hijau)
            successTitleEl.innerText = "Berhasil!";
            successMsgEl.innerText = "Mod kamu telah berhasil dipublikasikan secara publik.";
            iconContainer.className = "w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce";
            iconIcon.className = "fa-solid fa-check";
        }

        showToast(finalStatus === "pending" ? "Mod dikirim untuk ditinjau" : "Mod berhasil dipublikasikan!");

        // Pindah ke Step 4 (Finis)
        currentStep = 4;
        document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
        const step4 = document.getElementById('step-4');
        if (step4) step4.classList.add('active');
        updateProgress();

    } catch (err) {
        console.error("Error Detail:", err);
        showToast("Gagal: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Publish</span> <i class="fa-solid fa-paper-plane text-xs"></i>';
        }
    }
}

function removeImage(index) {
    uploadedImages[index] = null;
    
    // Reset UI Slot
    document.getElementById(`review${index}`).value = "";
    document.getElementById(`img-slot-${index}`).classList.add('hidden');
    document.getElementById(`img-slot-${index}`).src = "";
    document.getElementById(`label-slot-${index}`).classList.remove('hidden');
    document.getElementById(`del-slot-${index}`).classList.add('hidden');
    document.getElementById(`slot-container-${index}`).classList.remove('slot-success');
    
    const pb = document.getElementById(`progress-slot-${index}`);
    pb.style.width = '0';
    pb.style.background = 'transparent';
}

/* ======================== PREVIEW BINDING LOGIC ======================== */
function updatePreview() {
    // Text Bindings
    document.getElementById('prevTitle').innerText = document.getElementById('modName').value || 'Nama Mod Belum Diisi';
    document.getElementById('prevCategory').innerText = document.getElementById('modCategory').value || 'Kategori';
    document.getElementById('prevVersion').innerText = document.getElementById('modVersion').value || 'v1.0';
    document.getElementById('prevDesc').innerText = document.getElementById('modDesc').value || 'Deskripsi tidak tersedia.';
    document.getElementById('prevSize').innerText = document.getElementById('modSize').value || 'Ukuran tidak diketahui';

    // Feature Tags Preview
    const prevFeatures = document.getElementById('prevFeaturesContainer');
    prevFeatures.innerHTML = '';
    modFeatures.forEach(feat => {
        prevFeatures.innerHTML += `<span class="bg-dark-800 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg text-[10px] font-medium"><i class="fa-solid fa-check text-brand-red mr-1"></i>${feat}</span>`;
    });

    // Images Slider Binding
    const validImages = uploadedImages.filter(img => img !== null);
    if (validImages.length > 0) {
        const mainImg = document.getElementById('prevMainImage');
        mainImg.src = validImages[0];
        
        const counter = document.getElementById('prevImgCounter');
        if(validImages.length > 1) {
            counter.innerText = `1 / ${validImages.length}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }

        // Thumbnails
        const thumbContainer = document.getElementById('prevThumbnailContainer');
        thumbContainer.innerHTML = '';
        
        if (validImages.length > 1) {
            validImages.forEach((img, i) => {
                const div = document.createElement('div');
                div.className = `w-14 h-14 rounded-xl overflow-hidden border ${i === 0 ? 'border-brand-red shadow-glow-red opacity-100' : 'border-white/10 opacity-50'} shrink-0 transition-all`;
                div.innerHTML = `<img src="${img}" class="w-full h-full object-cover">`;
                thumbContainer.appendChild(div);
            });
        }
    }
}

/* ======================== UTILITIES ======================== */
document.getElementById('modDesc').addEventListener('input', function() {
    document.getElementById('charCount').textContent = `${this.value.length}/1000`;
});

function showToast(text) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        // Reset icon to success just in case it was changed to warning
        setTimeout(() => document.getElementById('toast').querySelector('i').className = "fa-solid fa-circle-check text-green-500", 400);
    }, 3000);
}
