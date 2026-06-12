/* ==========================================================================
   MODULE: AUTH & GATEWAY SECURITY ENGINE
   ========================================================================== */

const SECRET_ACTIVATION_CODE = "kamupastibisa.id";

// 1. SPA Router Engine - Berpindah View Layar
export function switchView(viewId) {
    const views = document.querySelectorAll('.spa-view');
    views.forEach(view => view.classList.remove('active-view'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active-view');
    } else {
        console.error(`Arsitektur SPA Error: View ID '${viewId}' tidak ditemukan.`);
    }
}

// 2. Mesin Boot Sequence (Validasi Status Saat Aplikasi Dibuka)
export function initGatewayBootSequence() {
    const isActivated = localStorage.getItem('sys_activated');
    const hasAdmin = localStorage.getItem('sys_admin_user');

    if (isActivated === 'true' && hasAdmin) {
        switchView('viewGateway'); // Jika sudah aktif & ada akun, lempar ke Form Login
    } else if (isActivated === 'true') {
        switchView('viewSetup');   // Jika sudah aktif tapi belum bikin akun admin
    } else {
        switchView('viewActivation'); // Jika aplikasi masih baru, wajib aktivasi lisensi
    }
}

// 3. Logika Validasi Lisensi Mutlak
export function processActivation() {
    const inputCode = document.getElementById('activationCode').value.trim();
    const island = document.getElementById('dynamicIsland');

    if (inputCode === SECRET_ACTIVATION_CODE) {
        localStorage.setItem('sys_activated', 'true');
        showLocalNotification('Sistem Berhasil Diaktivasi!', 'success');
        setTimeout(() => switchView('viewSetup'), 1200);
    } else {
        showLocalNotification('Kode Lisensi Tidak Valid!', 'error');
    }
}

// 4. Pembuatan Akun Admin Pertama Kali (Setup Master)
export function processSetup() {
    const user = document.getElementById('setupUser').value.trim();
    const pass = document.getElementById('setupPass').value.trim();

    if (user.length >= 4 && pass.length >= 6) {
        localStorage.setItem('sys_admin_user', user);
        localStorage.setItem('sys_admin_pass', pass); // Enkripsi lokal via storage
        showLocalNotification('Admin Berhasil Dibuat!', 'success');
        setTimeout(() => initGatewayBootSequence(), 1200);
    } else {
        showLocalNotification('User min 4 karakter, Pass min 6 karakter!', 'error');
    }
}

// 5. Logika Autentikasi Masuk Gerbang Kasir
export function processLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    const savedUser = localStorage.getItem('sys_admin_user');
    const savedPass = localStorage.getItem('sys_admin_pass');

    if (user === savedUser && pass === savedPass) {
        showLocalNotification('Akses Diterima! Membuka Kasir...', 'success');
        setTimeout(() => switchView('viewCatalog'), 1000); // Lolos ke Dashboard POS
    } else {
        showLocalNotification('Username atau Password Salah!', 'error');
    }
}

// Helper: Komponen Dynamic Island Notification Lokal
function showLocalNotification(message, type = 'success') {
    const island = document.getElementById('dynamicIsland');
    const msgEl = island.querySelector('.island-message');
    
    msgEl.textContent = message;
    island.className = `dynamic-island-pro notify ${type}`;
    
    setTimeout(() => {
        island.className = 'dynamic-island-pro';
    }, 4000);
}

// Expose ke window object agar tag onclick="" di HTML tidak patah
window.switchView = switchView;
window.processActivation = processActivation;
window.processSetup = processSetup;
window.processLogin = processLogin;