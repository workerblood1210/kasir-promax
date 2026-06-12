import { db } from '../database/db.js';

let currentActiveCart = [];

export function addProductToCart(product) {
    const existingItem = currentActiveCart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        currentActiveCart.push({ ...product, qty: 1 });
    }
    refreshCartUI();
}

export function refreshCartUI() {
    const badge = document.getElementById('cartCountBadge');
    const container = document.getElementById('cartItemsList');
    const totalText = document.getElementById('cartTotalValue');

    const calculatedQty = currentActiveCart.reduce((acc, curr) => acc + curr.qty, 0);
    badge.textContent = calculatedQty;

    if (currentActiveCart.length === 0) {
        container.innerHTML = `<div style="color: rgba(255,255,255,0.4); text-align: center; padding-top: 3rem;">Keranjang Anda masih kosong.</div>`;
        totalText.textContent = "Rp 0";
        return;
    }

    container.innerHTML = '';
    let totalBill = 0;

    currentActiveCart.forEach(item => {
        const subTotal = item.price * item.qty;
        totalBill += subTotal;

        const row = document.createElement('div');
        row.className = 'cart-item-row'; // Desain dipindahkan ke CSS eksternal
        row.innerHTML = `
            <div>
                <div style="font-weight: 600; font-size: 0.95rem;">${item.name}</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">Rp ${item.price.toLocaleString('id-ID')} x ${item.qty}</div>
            </div>
            <div style="font-weight: 700; color: #a78bfa;">Rp ${subTotal.toLocaleString('id-ID')}</div>
        `;
        container.appendChild(row);
    });

    totalText.textContent = `Rp ${totalBill.toLocaleString('id-ID')}`;
}

export async function processCheckout() {
    if (currentActiveCart.length === 0) return;

    const totalBill = currentActiveCart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Menyimpan transaksi ke IndexedDB (Aman, Persisten, tidak akan hilang secara acak)
    await db.transactions.add({
        timestamp: new Date().toISOString(),
        total_bill: totalBill,
        items: currentActiveCart
    });

    alert("🔒 Transaksi Berhasil Diproses Secara Aman!\nData disimpan ke database lokal.");
    currentActiveCart = [];
    refreshCartUI();
    document.getElementById('cartOverlay').classList.remove('active');
}