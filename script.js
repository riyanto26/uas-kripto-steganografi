// ==========================================
// 1. MODAL & LOADING HANDLERS
// ==========================================
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');

function showLoading(message) {
    loadingMessage.innerText = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showBrutalAlert(message) {
    document.getElementById('brutalAlertMessage').innerText = message;
    document.getElementById('brutalAlertOverlay').style.display = 'flex';
}

function closeBrutalAlert() {
    document.getElementById('brutalAlertOverlay').style.display = 'none';
}

function showInfoModal() {
    document.getElementById('infoModalOverlay').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('infoModalOverlay').style.display = 'none';
}

// ==========================================
// 2. MAIN TRIGGERS
// ==========================================
function triggerEncode() {
    showLoading("SEDANG MENERAPKAN SUPER ENKRIPSI...");
    setTimeout(() => {
        if(prosesSembunyikan()) {
            hideLoading();
        } else {
            hideLoading();
        }
    }, 1500);
}

function triggerDecode() {
    showLoading("EKSTRAKSI & DEKRIPSI SEDANG BERJALAN...");
    setTimeout(() => {
        if(prosesEkstrak()) {
            hideLoading();
        } else {
            hideLoading();
        }
    }, 1500);
}

// ==========================================
// 3. LOGIKA VIGENERE CIPHER
// ==========================================
function vigenereEncrypt(text, key) {
    let result = "";
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if(key.length === 0) return text;
    let keyIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char.match(/[a-z]/i)) {
            let code = text.charCodeAt(i);
            let isUpperCase = (char === char.toUpperCase());
            let base = isUpperCase ? 65 : 97;
            let k = key.charCodeAt(keyIndex % key.length) - 65;
            let encryptedChar = String.fromCharCode(((code - base + k) % 26) + base);
            result += encryptedChar;
            keyIndex++;
        } else {
            result += char;
        }
    }
    return result;
}

function vigenereDecrypt(text, key) {
    let result = "";
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if(key.length === 0) return text;
    let keyIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char.match(/[a-z]/i)) {
            let code = text.charCodeAt(i);
            let isUpperCase = (char === char.toUpperCase());
            let base = isUpperCase ? 65 : 97;
            let k = key.charCodeAt(keyIndex % key.length) - 65;
            let decryptedChar = String.fromCharCode(((code - base - k + 26) % 26) + base);
            result += decryptedChar;
            keyIndex++;
        } else {
            result += char;
        }
    }
    return result;
}

// ==========================================
// 4. HELPER KONVERSI BINER (UNTUK LSB)
// ==========================================
function textToBin(text) {
    return text.split('').map(char => {
        let bin = char.charCodeAt(0).toString(2);
        return '0'.repeat(8 - bin.length) + bin;
    }).join('');
}

function binToText(bin) {
    let bytes = bin.match(/.{1,8}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
}

// ==========================================
// 5. FUNGSI ENCODE (HIDING)
// ==========================================
function prosesSembunyikan() {
    const plainText = document.getElementById('plainText').value;
    const key = document.getElementById('encKey').value;
    const fileInput = document.getElementById('coverImage');
    
    if(!plainText || !key || fileInput.files.length === 0) {
        showBrutalAlert("Mohon isi pesan, kunci, dan pilih file gambar cover!");
        return false;
    }
    if (plainText.length > maxCapacityChars) {
        showBrutalAlert("🚨 OVERLOAD! Teks melebihi kapasitas maksimal yang diizinkan untuk gambar ini!");
        return false;
    }

    const cipherText = vigenereEncrypt(plainText, key);
    const penandaAkhir = "##END_UAS_K5##"; 
    const binerRahasia = textToBin(cipherText + penandaAkhir);

    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            if (binerRahasia.length > data.length * 0.75) {
                showBrutalAlert("Pesan terlalu panjang untuk kapasitas pixel gambar ini!");
                return;
            }

            let bitIndex = 0;
            for (let i = 0; i < data.length; i++) {
                if ((i + 1) % 4 === 0) continue; 
                if (bitIndex < binerRahasia.length) {
                    data[i] = (data[i] & 0xFE) | parseInt(binerRahasia[bitIndex]);
                    bitIndex++;
                } else {
                    break;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png');
            document.getElementById('stegoResultImg').src = dataUrl;
            document.getElementById('downloadLink').href = dataUrl;
            document.getElementById('encOutputArea').style.display = 'block';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    return true;
}

// ==========================================
// 6. FUNGSI DECODE (EXTRACTION)
// ==========================================
function prosesEkstrak() {
    const fileInput = document.getElementById('stegoImage');
    const key = document.getElementById('decKey').value;

    if(fileInput.files.length === 0 || !key) {
        showBrutalAlert("Mohon pilih Gambar Stego dan masukkan kunci dekripsi!");
        return false;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            let binerTerekstrak = "";
            for (let i = 0; i < data.length; i++) {
                if ((i + 1) % 4 === 0) continue; 
                binerTerekstrak += (data[i] & 1).toString();
            }

            let textHasilEkstraksi = binToText(binerTerekstrak);
            
            if (textHasilEkstraksi.includes("##END_UAS_K5##")) {
                let cipherTextTerpotong = textHasilEkstraksi.split("##END_UAS_K5##")[0];
                let plainTextAsli = vigenereDecrypt(cipherTextTerpotong, key);
                
                document.getElementById('extractedResult').innerText = plainTextAsli;
                document.getElementById('decOutputArea').style.display = 'block';
            } else {
                showBrutalAlert("Tidak ditemukan pesan rahasia yang valid di dalam gambar ini!");
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    return true;
}

// ==========================================
// 7. SHARE BUTTONS
// ==========================================
function shareWhatsApp() {
    const pesan = encodeURIComponent("🚨 *PESAN RAHASIA DITERIMA!* 🚨\n\nHalo! Saya telah mengirimkan pesan rahasia yang disembunyikan di dalam media gambar (Stego-Image) menggunakan sistem Super Enkripsi buatan Kelompok 5.\n\nTolong terima file gambar yang saya kirimkan dan dekripsi menggunakan web kita untuk membaca pesan aslinya!");
    window.open(`https://wa.me/?text=${pesan}`, '_blank');
}

// ==========================================
// 7. SHARE BUTTONS (UPDATE GMAIL WEB)
// ==========================================
function shareWhatsApp() {
    const pesan = encodeURIComponent("🚨 *PESAN RAHASIA DITERIMA!* 🚨\n\nHalo! Saya telah mengirimkan pesan rahasia yang disembunyikan di dalam media gambar (Stego-Image) menggunakan sistem Super Enkripsi buatan Kelompok 5.\n\nTolong terima file gambar yang saya kirimkan dan dekripsi menggunakan web kita untuk membaca pesan aslinya!");
    window.open(`https://wa.me/?text=${pesan}`, '_blank');
}

function shareEmail() {
    const subject = encodeURIComponent("CONFIDENTIAL: Dokumen Stego-Image (UAS Kriptografi Kelompok 5)");
    const body = encodeURIComponent("Halo,\n\nSaya akan melampirkan sebuah gambar Stego-Image yang berisi pesan rahasia terenkripsi (Vigenere + LSB). Silakan simpan gambar lampiran tersebut dan gunakan aplikasi web Kelompok 5 untuk mengekstrak pesannya.\n\nTerima kasih.");
    
    // MENGGUNAKAN API URL GMAIL WEB (Tembus di OS apa saja)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
}

// ==========================================
// 8. LOGIKA LIVE CAPACITY METER
// ==========================================
let maxCapacityChars = 0;

// Trigger setiap kali user mengunggah gambar cover
document.getElementById('coverImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        document.getElementById('capacityContainer').style.display = 'none';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Simulasi canvas untuk membaca pixel
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);

            const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imgData.data;

            // Hitung total pixel warna valid (Abaikan channel Alpha/Transparansi)
            let validPixels = 0;
            for (let i = 0; i < data.length; i++) {
                if ((i + 1) % 4 !== 0) validPixels++;
            }

 // Rumus Kapasitas LSB asli dari total pixel
let kapasitasAsli = Math.floor(validPixels / 8) - 14; 

// Trik UI Presentasi: Batasi maksimal kapasitas yang tampil hanya 100 karakter
// (Jika kapasitas asli lebih dari 100, maka set di angka 100 agar bar cepat penuh)
maxCapacityChars = kapasitasAsli > 100 ? 100 : kapasitasAsli;
            
            document.getElementById('capacityContainer').style.display = 'block';
            updateCapacityMeter();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Trigger setiap kali user mengetik pesan di text area
document.getElementById('plainText').addEventListener('input', updateCapacityMeter);

function updateCapacityMeter() {
    if (maxCapacityChars === 0) return;

    const currentChars = document.getElementById('plainText').value.length;
    const capacityText = document.getElementById('capacityText');
    const capacityBar = document.getElementById('capacityBar');

    capacityText.innerText = `${currentChars} / ${maxCapacityChars} Karakter`;

    let percentage = (currentChars / maxCapacityChars) * 100;
    if (percentage > 100) percentage = 100;

    capacityBar.style.width = `${percentage}%`;

    // Visual Feedback ala Neo-Brutalism
    if (currentChars > maxCapacityChars) {
        capacityBar.style.backgroundColor = '#FF3131'; // Merah Bahaya
        capacityText.style.color = '#FF3131';
    } else if (percentage > 80) {
        capacityBar.style.backgroundColor = '#FFDE59'; // Kuning Peringatan
        capacityText.style.color = 'var(--black)';
    } else {
        capacityBar.style.backgroundColor = '#25D366'; // Hijau Aman
        capacityText.style.color = 'var(--black)';
    }
}

// ==========================================
// FUNGSI NAVIGASI TAB (ENCODE / DECODE)
// ==========================================
function switchTab(tabName) {
    const encodeSec = document.getElementById('encodeSection');
    const decodeSec = document.getElementById('decodeSection');
    const navEncode = document.getElementById('navEncode');
    const navDecode = document.getElementById('navDecode');

    if (tabName === 'encode') {
        // Tampilkan Encode, Sembunyikan Decode
        encodeSec.style.display = 'block';
        decodeSec.style.display = 'none';
        
        // Atur status aktif pada Navbar
        navEncode.classList.add('active');
        navDecode.classList.remove('active');
    } else if (tabName === 'decode') {
        // Tampilkan Decode, Sembunyikan Encode
        encodeSec.style.display = 'none';
        decodeSec.style.display = 'block';
        
        // Atur status aktif pada Navbar
        navDecode.classList.add('active');
        navEncode.classList.remove('active');
    }
}