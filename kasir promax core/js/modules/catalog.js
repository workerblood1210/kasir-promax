/* ==========================================================================
   MODULE: CORE POS CATALOG & CRUD SEARCH ENGINE
   ========================================================================== */

// Mock Data Dummy Produk (Jika IndexedDB/Dexie belum ditarik)
const SAMPLE_PRODUCTS = [
    { id: 1, name: "iPhone 15 Pro Max", price: 24999000, category: "gadget" },
    { id: 2, name: "MacBook Pro M3", price: 35499000, category: "gadget" },
    { id: 3, name: "Kopi Espresso Premium", price: 35000, category: "food" },
    { id: 4, name: "Croissant Almond", price: 42000, category: "food" },
    { id: 5, name: "Paper Bag Exclusive", price: 15000, category: "other" }
];

// 1. Engine Render Katalog Utama
export function renderPOSCatalog(searchQuery = '', filterCategory = 'all') {
    const catalogGrid = document.getElementById('catalogGrid');
    if (!catalogGrid) return;

    catalogGrid.innerHTML = ''; // Clear container

    // Saring data berdasarkan query pencarian & tombol kategori
    const filteredData = SAMPLE_PRODUCTS.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (filteredData.length === 0) {
        catalogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; opacity:0.5; padding:3rem;">Produk tidak ditemukan...</div>`;
        return;
    }

    // Render komponen kartu produk ala iOS 27 Glassmorphism
    filteredData.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-title">${product.name}</div>
            <div class="product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
            <button class="btn btn-primary" style="padding: 0.6rem; font-size:0.85rem; border-radius:12px; margin-top:0.5rem;" onclick="window.addToCartEngine(${product.id})">
                + Tambah
            </button>
        `;
        catalogGrid.appendChild(card);
    });
}

// 2. Setup Event Listener untuk Input Pencarian dan Kategori
export function setupCatalogDOMEventListeners() {
    const searchInput = document.getElementById('catalogSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const catButtons = document.querySelectorAll('.cat-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
            
            if (clearSearchBtn) {
                if (query.length > 0) clearSearchBtn.classList.add('active');
                else clearSearchBtn.classList.remove('active');
            }
            renderPOSCatalog(query, activeCat);
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.classList.remove('active');
            const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
            renderPOSCatalog('', activeCat);
            searchInput.focus();
        });
    }

    catButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            catButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const query = searchInput ? searchInput.value : '';
            renderPOSCatalog(query, e.target.dataset.cat);
        });
    });
}

// Dummy Cart Engine Handler agar tombol "+ Tambah" tidak crash sebelum modul keranjang Anda dibuat
window.addToCartEngine = function(productId) {
    console.log(`Produk ID ${productId} dimasukkan ke keranjang belanja.`);
};

// Expose ke global window
window.renderPOSCatalog = renderPOSCatalog;
window.setupCatalogDOMEventListeners = setupCatalogDOMEventListeners;