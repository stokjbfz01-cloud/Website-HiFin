// Animasi angka berjalan (Count Up)
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerText = Math.floor(progress * (end - start) + start).toLocaleString('id-ID');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Trigger animasi angka saat load
window.addEventListener('load', () => {
    const stats = document.querySelectorAll('h3');
    stats.forEach(s => {
        const val = parseInt(s.innerText.replace('.', ''));
        if (!isNaN(val)) {
            animateValue(s, 0, val, 2000);
        }
    });
});
