// js/app.js - Versi Upgrade dengan Chroma.js dan ColorThief.js

document.addEventListener('DOMContentLoaded', () => {
    // ----- Pendaftaran Service Worker & Penanganan Mode Offline -----
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('ServiceWorker berhasil didaftarkan.', reg))
                .catch(err => console.log('Pendaftaran ServiceWorker gagal: ', err));
        });
    }

    const offlineNotification = document.getElementById('offline-notification');
    const updateOnlineStatus = () => {
        offlineNotification.style.display = navigator.onLine ? 'none' : 'block';
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // ----- Elemen DOM -----
    const colorPicker = document.getElementById('color-picker');
    const hexCode = document.getElementById('hex-code');
    const rgbCode = document.getElementById('rgb-code');
    const generateBtn = document.getElementById('generate-palette-btn');
    const generatedPaletteContainer = document.getElementById('generated-palette');
    const imageUploader = document.getElementById('image-uploader');
    const imagePreview = document.getElementById('image-preview');
    const imagePaletteContainer = document.getElementById('image-palette');
    const contrastColor1 = document.getElementById('contrast-color1');
    const contrastColor2 = document.getElementById('contrast-color2');
    const contrastRatioEl = document.getElementById('contrast-ratio');
    const contrastStatusEl = document.getElementById('contrast-status');
    const contrastPreview = document.getElementById('contrast-preview');

    // ----- Fungsi Helper -----
    const createColorBox = (color) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.textContent = color.toUpperCase();
        colorBox.style.color = chroma.contrast(color, 'white') > 4.5 ? 'white' : 'black'; // Teks dinamis

        colorBox.addEventListener('click', () => {
            navigator.clipboard.writeText(color).then(() => {
                colorBox.textContent = 'Copied!';
                setTimeout(() => { 
                    colorBox.textContent = color.toUpperCase(); 
                }, 1000);
            });
        });
        return colorBox;
    };

    const renderPalette = (container, colors) => {
        container.innerHTML = '';
        colors.forEach(color => {
            container.appendChild(createColorBox(color));
        });
    };
    
    // ----- Logika Fitur (UPGRADED) -----

    // 1. Color Picker
    const updateColorPicker = (color) => {
        hexCode.textContent = color;
        // Gunakan Chroma.js untuk konversi yang andal
        rgbCode.textContent = chroma(color).css('rgb');
        contrastColor2.value = color;
        updateContrastChecker();
    };
    colorPicker.addEventListener('input', (e) => updateColorPicker(e.target.value));

    // 2. Palette Generator (UPGRADED dengan Chroma.js)
    const generatePalette = () => {
        const baseColor = chroma(colorPicker.value);
        
        // Membuat palet 5 warna yang harmonis: Analog + Komplementer + Terang/Gelap
        const palette = [
            baseColor.hex(),
            baseColor.set('hsl.h', '+30').hex(), // Analog
            baseColor.darken(1.5).hex(),        // Versi Gelap
            baseColor.set('hsl.h', '+180').hex(),// Komplementer
            baseColor.saturate(2).brighten(1).hex() // Versi Terang & Jenuh
        ];
        renderPalette(generatedPaletteContainer, palette);
    };
    generateBtn.addEventListener('click', generatePalette);

    // 3. Image Extractor (UPGRADED dengan ColorThief.js)
    imageUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                imagePreview.onload = () => {
                    // Inisialisasi ColorThief
                    const colorThief = new ColorThief();
                    // Ekstrak 5 warna dominan dari gambar
                    const paletteRGB = colorThief.getPalette(imagePreview, 5);
                    
                    // Konversi array RGB ke array HEX
                    const paletteHex = paletteRGB.map(rgb => chroma(rgb).hex());
                    
                    renderPalette(imagePaletteContainer, paletteHex);
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 4. Contrast Checker (UPGRADED dengan Chroma.js)
    const updateContrastChecker = () => {
        const color1 = contrastColor1.value;
        const color2 = contrastColor2.value;

        contrastPreview.style.color = color1;
        contrastPreview.style.backgroundColor = color2;
        
        // Gunakan Chroma.js untuk menghitung rasio kontras secara akurat
        const ratio = chroma.contrast(color1, color2);
        contrastRatioEl.textContent = ratio.toFixed(2);
        
        // Tentukan status kelulusan WCAG
        if (ratio >= 7) {
            contrastStatusEl.textContent = 'AAA';
            contrastStatusEl.style.backgroundColor = '#27ae60'; // Hijau tua (Sangat Baik)
        } else if (ratio >= 4.5) {
            contrastStatusEl.textContent = 'AA';
            contrastStatusEl.style.backgroundColor = '#2ecc71'; // Hijau (Baik)
        } else {
            contrastStatusEl.textContent = 'Fail';
            contrastStatusEl.style.backgroundColor = '#e74c3c'; // Merah (Gagal)
        }
    };
    contrastColor1.addEventListener('input', updateContrastChecker);
    contrastColor2.addEventListener('input', updateContrastChecker);

    // ----- Inisialisasi Aplikasi -----
    updateColorPicker(colorPicker.value);
    generatePalette();
    updateContrastChecker();
});