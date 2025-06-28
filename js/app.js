// File: js/app.js (Ganti seluruh isinya dengan ini)

document.addEventListener("DOMContentLoaded", () => {
    
  // --- 1. PENDAFTARAN SERVICE WORKER ---
  if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
          navigator.serviceWorker
              .register("sw.js") // Pastikan path ke sw.js benar
              .then((reg) => console.log("ServiceWorker berhasil didaftarkan.", reg))
              .catch((err) => console.log("Pendaftaran ServiceWorker gagal: ", err));
      });
  }

  // --- 2. LOGIKA UNTUK NOTIFIKASI OFFLINE ---
  const offlineNotification = document.getElementById("offline-notification");
  const updateOnlineStatus = () => {
      if (offlineNotification) {
          offlineNotification.style.display = navigator.onLine ? "none" : "block";
      }
  };
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  // --- 3. LOGIKA UNTUK INSTALASI PWA ---
  const installButton = document.getElementById('install-button');
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
      // Mencegah prompt bawaan browser muncul
      e.preventDefault();
      // Simpan event agar bisa dipicu nanti
      deferredPrompt = e;
      // Tampilkan tombol instalasi kita
      if (installButton) {
          installButton.style.display = 'inline-flex';
      }
      console.log(`'beforeinstallprompt' event diaktifkan. Aplikasi siap diinstal.`);
  });

  if (installButton) {
      installButton.addEventListener('click', async () => {
          if (deferredPrompt) {
              // Sembunyikan tombol kita sebelum menampilkan prompt
              installButton.style.display = 'none';
              
              // Tampilkan prompt instalasi
              deferredPrompt.prompt();
              
              // Tunggu pengguna merespons
              const { outcome } = await deferredPrompt.userChoice;
              console.log(`Respons pengguna: ${outcome}`);
              
              // Event ini hanya bisa digunakan sekali
              deferredPrompt = null;
          }
      });
  }

  window.addEventListener('appinstalled', () => {
      // Sembunyikan tombol jika aplikasi sudah diinstal
      if (installButton) {
          installButton.style.display = 'none';
      }
      deferredPrompt = null;
      console.log('Aplikasi JedaWarna berhasil diinstal!');
  });


  // --- 4. SEMUA FUNGSI APLIKASI ANDA YANG LAIN ---
  // (Kode untuk color picker, palette generator, dll. letakkan di sini)

  const colorPicker = document.getElementById("color-picker");
  const hexCode = document.getElementById("hex-code");
  const rgbCode = document.getElementById("rgb-code");
  const generateBtn = document.getElementById("generate-palette-btn");
  const generatedPaletteContainer = document.getElementById("generated-palette");
  const imageUploader = document.getElementById("image-uploader");
  const imagePreview = document.getElementById("image-preview");
  const imagePaletteContainer = document.getElementById("image-palette");
  const contrastColor1 = document.getElementById("contrast-color1");
  const contrastColor2 = document.getElementById("contrast-color2");
  const contrastRatioEl = document.getElementById("contrast-ratio");
  const contrastStatusEl = document.getElementById("contrast-status");
  const contrastPreview = document.getElementById("contrast-preview");

  const createColorBox = (color) => {
      const colorBox = document.createElement("div");
      colorBox.className = "color-box";
      colorBox.style.backgroundColor = color;
      colorBox.textContent = color.toUpperCase();
      if (chroma) {
          colorBox.style.color = chroma.contrast(color, "white") > 4.5 ? "white" : "black";
      }

      colorBox.addEventListener("click", () => {
          navigator.clipboard.writeText(color).then(() => {
              colorBox.textContent = "Copied!";
              setTimeout(() => {
                  colorBox.textContent = color.toUpperCase();
              }, 1000);
          });
      });
      return colorBox;
  };

  const renderPalette = (container, colors) => {
      container.innerHTML = "";
      colors.forEach((color) => {
          container.appendChild(createColorBox(color));
      });
  };

  const updateColorPicker = (color) => {
      if (!hexCode || !rgbCode || !contrastColor2) return;
      hexCode.textContent = color;
      if (chroma) {
          rgbCode.textContent = chroma(color).css("rgb");
      }
      contrastColor2.value = color;
      updateContrastChecker();
  };
  
  if (colorPicker) {
      colorPicker.addEventListener("input", (e) => updateColorPicker(e.target.value));
  }

  const generatePalette = () => {
      if (!chroma || !colorPicker || !generatedPaletteContainer) return;
      const baseColor = chroma(colorPicker.value);
      const palette = [
          baseColor.hex(),
          baseColor.set("hsl.h", "+30").hex(),
          baseColor.darken(1.5).hex(),
          baseColor.set("hsl.h", "+180").hex(),
          baseColor.saturate(2).brighten(1).hex(),
      ];
      renderPalette(generatedPaletteContainer, palette);
  };
  
  if (generateBtn) {
      generateBtn.addEventListener("click", generatePalette);
  }
  
  if (imageUploader) {
      imageUploader.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file && imagePreview && ColorThief) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  imagePreview.src = event.target.result;
                  imagePreview.style.display = "block";
                  imagePreview.onload = () => {
                      const colorThief = new ColorThief();
                      const paletteRGB = colorThief.getPalette(imagePreview, 5);
                      const paletteHex = paletteRGB.map((rgb) => chroma(rgb).hex());
                      renderPalette(imagePaletteContainer, paletteHex);
                  };
              };
              reader.readAsDataURL(file);
          }
      });
  }

  const updateContrastChecker = () => {
      if (!contrastColor1 || !contrastColor2 || !contrastPreview || !contrastRatioEl || !contrastStatusEl) return;
      const color1 = contrastColor1.value;
      const color2 = contrastColor2.value;
      contrastPreview.style.color = color1;
      contrastPreview.style.backgroundColor = color2;

      if (chroma) {
          const ratio = chroma.contrast(color1, color2);
          contrastRatioEl.textContent = ratio.toFixed(2);
          if (ratio >= 7) {
              contrastStatusEl.textContent = "AAA";
              contrastStatusEl.style.backgroundColor = "#27ae60";
          } else if (ratio >= 4.5) {
              contrastStatusEl.textContent = "AA";
              contrastStatusEl.style.backgroundColor = "#2ecc71";
          } else {
              contrastStatusEl.textContent = "Fail";
              contrastStatusEl.style.backgroundColor = "#e74c3c";
          }
      }
  };
  
  if (contrastColor1) {
      contrastColor1.addEventListener("input", updateContrastChecker);
  }
  if (contrastColor2) {
      contrastColor2.addEventListener("input", updateContrastChecker);
  }
  
  // Inisialisasi Aplikasi
  if (colorPicker) {
      updateColorPicker(colorPicker.value);
      generatePalette();
      updateContrastChecker();
  }
});