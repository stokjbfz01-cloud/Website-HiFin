function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = overlay.querySelector('.modal-container');
    
    // 1. Jalankan Animasi Keluar
    modal.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    modal.style.transform = "scale(0.9) translateY(20px)";
    modal.style.opacity = "0";
    
    overlay.style.transition = "all 0.4s ease";
    overlay.style.backdropFilter = "blur(0px)";
    overlay.style.backgroundColor = "transparent";
    
    // 2. Tunggu animasi selesai, lalu kembali ke halaman sebelumnya
    setTimeout(() => {
        // Cek jika ada riwayat halaman, jika tidak ada (misal buka tab baru), arahkan ke Beranda
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "../index.html"; // Ganti dengan nama file utama kamu
        }
    }, 400); // 400ms sesuai dengan durasi transisi di atas
}
