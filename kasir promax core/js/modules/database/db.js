/* ==========================================================================\
   DATABASE ENGINE - KASIR PROMAX (FIXED FOR LOCAL STANDARD SCRIPT)
   ========================================================================== */

// Ambil instance Dexie langsung dari window object global yang sudah dimuat oleh index.html
const Dexie = window.Dexie;

if (!Dexie) {
    console.error("Fatal Error: Pustaka Dexie.js gagal dimuat ke sistem global window!");
}

export const db = new Dexie('KasirPromaxDB');

// Mengonfigurasi skema tabel database offline
db.version(1).stores({
    system_config: 'key, value',       // Menyimpan status aktivasi & parameter toko
    admin_auth: 'username, password',   // Menyimpan kredensial admin terenkripsi lokal
    products: '++id, name, price, category', // Katalog produk dengan index untuk search cepat
    transactions: '++id, timestamp, total_bill, items' // Histori transaksi penjualan
});

// Fungsi otomatis untuk mengisi data master jika database masih kosong (Seeding)
export async function seedInitialDatabase() {
    const productCount = await db.products.count();
    if (productCount === 0) {
        await db.products.bulkAdd([
            { name: "Kopi Promax Premium", price: 25000, category: "minuman" },
            { name: "Espresso Boost iOS 27", price: 18000, category: "minuman" },
            { name: "Burger Pro Max Ultra", price: 45000, category: "makanan" },
            { name: "Sandwich Core Fluid", price: 32000, category: "makanan" },
            { name: "Kentang Goreng Ambient", price: 20000, category: "snack" }
        ]);
    }
}