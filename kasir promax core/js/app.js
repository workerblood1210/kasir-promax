import { db, seedInitialDatabase } from './database/db.js';
import { processCheckout } from './modules/cart.js';

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered Successfully', reg.scope))
            .catch(err => console.error('Service Worker Registration Failed', err));
    });
}

// Inisialisasi Database Sekaligus Binding Event
window.addEventListener('DOMContentLoaded', async () => {
    // Jalankan seeding database lokal dan pastikan selesai (await)
    await seedInitialDatabase();
    console.log("Database seeded successfully.");
    
    // Binding tombol checkout menggunakan ID baru yang lebih aman dari perubahan atribut inline
    const checkoutBtn = document.getElementById('checkoutBtnVisual');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processCheckout);
    }
    
    console.log("Kasir Promax OS Engine Core successfully initialized.");
});