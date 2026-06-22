/**
 * ======================================================================
 * CATERING PRICING ENGINE - FASE B ARCHITECTURE (CTO APPROVED)
 * ======================================================================
 * File: script.js
 * Deskripsi: Multi-recipe state manager, auto unit conversion,
 * IndexedDB integration, dan engine ekspor data.
 * ======================================================================
 */

const Utils = {
    safeFloat: (value, fallback = 0) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) || parsed < 0 ? fallback : parsed;
    },
    
    formatRupiah: (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    },
    
    roundUp: (number, multiple = 500) => {
        if (number <= 0) return 0;
        return Math.ceil(number / multiple) * multiple;
    },
    
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// STRUKTUR DATA MULTI-RESEP (FASE B)
let AppState = {
    currentRecipeId: "default",
    recipes: [
        {
            id: "default",
            namaResep: "Resep Utama Katering",
            konfigurasi: { targetPorsi: 1, margin: 30, buffer: 5 },
            bahanBaku: [],
            overhead: {
                tetap: { listrikGas: 0, tenagaKerja: 0, transport: 0 },
                variabel: { kemasan: 0, lainLain: 0 }
            }
        }
    ]
};

const StorageManager = {
    DB_NAME: 'KateringProDB_v2',
    STORE_NAME: 'MultiRecipeStore',
    VERSION: 1,
    db: null,

    initDB: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(StorageManager.DB_NAME, StorageManager.VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(StorageManager.STORE_NAME)) {
                    db.createObjectStore(StorageManager.STORE_NAME);
                }
            };
            request.onsuccess = (e) => {
                StorageManager.db = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    save: async () => {
        if (!StorageManager.db) await StorageManager.initDB();
        return new Promise((resolve, reject) => {
            const tx = StorageManager.db.transaction(StorageManager.STORE_NAME, 'readwrite');
            const store = tx.objectStore(StorageManager.STORE_NAME);
            store.put(AppState, 'app_state_data');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    load: async () => {
        if (!StorageManager.db) await StorageManager.initDB();
        return new Promise((resolve, reject) => {
            const tx = StorageManager.db.transaction(StorageManager.STORE_NAME, 'readonly');
            const store = tx.objectStore(StorageManager.STORE_NAME);
            const request = store.get('app_state_data');
            request.onsuccess = () => {
                if (request.result) {
                    AppState = request.result;
                }
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }
};

const CateringEngine = {
    // HELPER: MENDAPATKAN AKTIF RESEP
    getLiveRecipe: () => {
        let recipe = AppState.recipes.find(r => r.id === AppState.currentRecipeId);
        if (!recipe) {
            recipe = AppState.recipes[0];
            AppState.currentRecipeId = recipe.id;
        }
        return recipe;
    },

    // ENGINE KONVERSI SATUAN OTOMATIS (FASE B)
    hitungSubtotalBahan: (bahan) => {
        const hargaBeli = Utils.safeFloat(bahan.hargaBeli);
        const beratBeli = Utils.safeFloat(bahan.beratBeli, 1);
        const beratDipakai = Utils.safeFloat(bahan.beratDipakai);
        const yieldSafe = Utils.safeFloat(bahan.yieldFactor, 100) / 100 || 1;

        // Faktor konversi ke satuan dasar (gram atau ml)
        let multiplierBeli = (bahan.satuanBeli === 'kg' || bahan.satuanBeli === 'l') ? 1000 : 1;
        let multiplierPakai = (bahan.satuanPakai === 'kg' || bahan.satuanPakai === 'l') ? 1000 : 1;

        const totalUnitBeli = beratBeli * multiplierBeli;
        const totalUnitPakai = beratDipakai * multiplierPakai;

        const hargaPerUnitDasar = hargaBeli / totalUnitBeli;
        const costKotor = hargaPerUnitDasar * totalUnitPakai;

        return costKotor / yieldSafe;
    },

    kalkulasiTotal: () => {
        const recipe = CateringEngine.getLiveRecipe();
        const targetPorsi = Utils.safeFloat(recipe.konfigurasi.targetPorsi, 1) || 1;

        const totalBiayaBahan = recipe.bahanBaku.reduce((sum, item) => {
            return sum + CateringEngine.hitungSubtotalBahan(item);
        }, 0);

        const totalFixedOverhead = 
            Utils.safeFloat(recipe.overhead.tetap.listrikGas) +
            Utils.safeFloat(recipe.overhead.tetap.tenagaKerja) +
            Utils.safeFloat(recipe.overhead.tetap.transport);
        
        const fixedPerPorsi = totalFixedOverhead / targetPorsi;
        const variablePerPorsi = 
            Utils.safeFloat(recipe.overhead.variabel.kemasan) +
            Utils.safeFloat(recipe.overhead.variabel.lainLain);

        const hppMurniPerPorsi = (totalBiayaBahan / targetPorsi) + fixedPerPorsi + variablePerPorsi;
        const bufferRate = Utils.safeFloat(recipe.konfigurasi.buffer) / 100;
        const hppAmanPerPorsi = hppMurniPerPorsi * (1 + bufferRate);

        const marginRate = Utils.safeFloat(recipe.konfigurasi.margin) / 100;
        const marginAman = marginRate >= 1 ? 0.99 : marginRate;
        
        const hargaJualKotor = hppAmanPerPorsi / (1 - marginAman);
        const hargaJualFinal = Utils.roundUp(hargaJualKotor, 500);

        const profitPerPorsi = hargaJualFinal - hppAmanPerPorsi;
        const totalProfit = profitPerPorsi * targetPorsi;
        const persentaseProfitReal = (profitPerPorsi / hargaJualFinal) * 100;

        return {
            totalBiayaBahan,
            totalFixedOverhead,
            hppMurniPerPorsi,
            hppAmanPerPorsi,
            hargaJualFinal,
            profitPerPorsi,
            totalProfit,
            persentaseProfitReal: isNaN(persentaseProfitReal) ? 0 : persentaseProfitReal.toFixed(1)
        };
    }
};

const AppController = {
    init: async () => {
        await StorageManager.load();
    },

    // MANAJEMEN MULTI-RESEP
    tambahResepBaru: async (nama) => {
        const id = Utils.generateId();
        AppState.recipes.push({
            id: id,
            namaResep: nama || "Resep Baru Baru",
            konfigurasi: { targetPorsi: 1, margin: 30, buffer: 5 },
            bahanBaku: [],
            overhead: {
                tetap: { listrikGas: 0, tenagaKerja: 0, transport: 0 },
                variabel: { kemasan: 0, lainLain: 0 }
            }
        });
        AppState.currentRecipeId = id;
        await StorageManager.save();
        return id;
    },

    hapusResepAktif: async () => {
        if (AppState.recipes.length <= 1) return alert("Gak bisa dihapus! Minimal harus ada 1 resep di aplikasi.");
        AppState.recipes = AppState.recipes.filter(r => r.id !== AppState.currentRecipeId);
        AppState.currentRecipeId = AppState.recipes[0].id;
        await StorageManager.save();
    },

    pindahResep: async (id) => {
        AppState.currentRecipeId = id;
        await StorageManager.save();
    },

    ubahNamaResepAktif: async (nama) => {
        const recipe = CateringEngine.getLiveRecipe();
        recipe.namaResep = nama;
        await StorageManager.save();
    },

    // MANAJEMEN BAHAN BAKU + SATUAN (FASE B INJECTION)
    tambahBahanBaku: async (nama, hargaBeli, beratBeli, satuanBeli, beratDipakai, satuanPakai, yieldFactor) => {
        const recipe = CateringEngine.getLiveRecipe();
        recipe.bahanBaku.push({
            id: Utils.generateId(),
            nama,
            hargaBeli: Utils.safeFloat(hargaBeli),
            beratBeli: Utils.safeFloat(beratBeli),
            satuanBeli,
            beratDipakai: Utils.safeFloat(beratDipakai),
            satuanPakai,
            yieldFactor: Utils.safeFloat(yieldFactor, 100)
        });
        await StorageManager.save();
    },

    hapusBahanBaku: async (id) => {
        const recipe = CateringEngine.getLiveRecipe();
        recipe.bahanBaku = recipe.bahanBaku.filter(b => b.id !== id);
        await StorageManager.save();
    },

    updateKonfigurasi: async (key, value) => {
        const recipe = CateringEngine.getLiveRecipe();
        if(recipe.konfigurasi[key] !== undefined) {
            recipe.konfigurasi[key] = Utils.safeFloat(value);
            await StorageManager.save();
        }
    },

    updateOverhead: async (tipe, nama, value) => {
        const recipe = CateringEngine.getLiveRecipe();
        if(recipe.overhead[tipe] && recipe.overhead[tipe][nama] !== undefined) {
            recipe.overhead[tipe][nama] = Utils.safeFloat(value);
            await StorageManager.save();
        }
    },

    // EXPORT ENGINE (EXCEL/CSV COMPATIBLE)
    exportKeExcel: () => {
        const recipe = CateringEngine.getLiveRecipe();
        const hasil = CateringEngine.kalkulasiTotal();
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `LAPORAN HPP KATERING PRO - RECONSTRUCTION SYSTEM\r\n`;
        csvContent += `Nama Resep,${recipe.namaResep}\r\n`;
        csvContent += `Target Porsi,${recipe.konfigurasi.targetPorsi}\r\n\r\n`;
        
        csvContent += `DAFTAR BAHAN BAKU\r\n`;
        csvContent += `Nama Bahan,Harga Beli,Kapasitas Beli,Satuan Beli,Berat Dipakai,Satuan Pakai,Yield %,Subtotal Cost\r\n`;
        
        recipe.bahanBaku.forEach(b => {
            const cost = CateringEngine.hitungSubtotalBahan(b);
            csvContent += `"${b.nama}",${b.hargaBeli},${b.beratBeli},${b.satuanBeli},${b.beratDipakai},${b.satuanPakai},${b.yieldFactor}%,${cost.toFixed(0)}\r\n`;
        });
        
        csvContent += `\r\nRINGKASAN BISNIS\r\n`;
        csvContent += `Total Biaya Bahan Baku,${hasil.totalBiayaBahan.toFixed(0)}\r\n`;
        csvContent += `Total Overhead Tetap,${hasil.totalFixedOverhead.toFixed(0)}\r\n`;
        csvContent += `HPP Aman Per Porsi,${hasil.hppAmanPerPorsi.toFixed(0)}\r\n`;
        csvContent += `Harga Jual Final,${hasil.hargaJualFinal.toFixed(0)}\r\n`;
        csvContent += `Profit Per Porsi,${hasil.profitPerPorsi.toFixed(0)} (${hasil.persentaseProfitReal}%)\r\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HPP_${recipe.namaResep.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};