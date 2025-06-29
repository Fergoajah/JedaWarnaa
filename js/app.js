document.addEventListener("DOMContentLoaded", () => {

  // --- 1. INSTALASI PWA ---
  // Bagian ini menangani fungsionalitas untuk menginstal aplikasi web sebagai PWA.
  let deferredPrompt;
  const installButton = document.getElementById("install");

  // Event listener ini akan dipicu oleh browser jika aplikasi memenuhi kriteria PWA dan belum diinstal.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installButton) {
      installButton.style.display = "inline-flex";
    }
  });

  // Fungsi yang dipanggil saat user klik button install.
  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (installButton) {
        installButton.style.display = "none";
      }
    }
  }

  // Menambahkan event listener ke tombol instalasi.
  if (installButton) {
    installButton.addEventListener("click", installApp);
  }

  // Event listener ini akan dipicu setelah aplikasi berhasil diinstal.
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });


  // --- 2. PENDAFTARAN SERVICE WORKER ---
  // Service Worker memungkinkan aplikasi untuk bekerja secara offline dan menangani push notification.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("ServiceWorker berhasil didaftarkan.", reg))
      .catch((err) => console.log("Pendaftaran ServiceWorker gagal: ", err));
  }


  // --- 3. LOGIKA NOTIFIKASI OFFLINE ---
  // Bagian ini menampilkan pesan kepada pengguna jika koneksi internet terputus.
  const offlineNotification = document.getElementById("offline-notification");
  if (offlineNotification) {
    const updateOnlineStatus = () => {
      offlineNotification.style.display = navigator.onLine ? "none" : "block";
    };
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }


  // --- 4. LOGIKA UTAMA APLIKASI (Color Palette, Kontras, dll) ---
  // Bagian ini berisi semua fungsionalitas inti dari aplikasi palet warna.
  // Mengambil semua elemen DOM yang dibutuhkan untuk interaksi.
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

  // Fungsi untuk membuat satu kotak warna dalam sebuah palet.
  const createColorBox = (color) => {
    const colorBox = document.createElement("div");
    colorBox.className = "color-box";
    colorBox.style.backgroundColor = color;
    colorBox.textContent = color.toUpperCase();

    // Menggunakan library Chroma.js untuk menentukan warna teks (hitam/putih) agar mudah dibaca.
    if (chroma) {
      colorBox.style.color =
        chroma.contrast(color, "white") > 4.5 ? "white" : "black";
    }

    // Menambahkan event listener untuk menyalin kode warna ke clipboard saat diklik.
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

  // Fungsi untuk merender seluruh palet warna ke dalam kontainer.
  const renderPalette = (container, colors) => {
    container.innerHTML = "";
    colors.forEach((color) => {
      container.appendChild(createColorBox(color));
    });
  };

  // Fungsi untuk memperbarui UI saat pengguna memilih warna baru dari color picker.
  const updateColorPicker = (color) => {
    if (!hexCode || !rgbCode || !contrastColor2) return;
    hexCode.textContent = color;
    if (chroma) {
      rgbCode.textContent = chroma(color).css("rgb");
    }
    // Jadikan warna yang dipilih sebagai warna kedua pada pengecek kontras.
    contrastColor2.value = color;
    updateContrastChecker();
  };

  // Menambahkan event listener ke color picker utama.
  if (colorPicker) {
    colorPicker.addEventListener("input", (e) =>
      updateColorPicker(e.target.value)
    );
  }

  // Fungsi untuk membuat palet warna secara otomatis berdasarkan warna utama.
  const generatePalette = () => {
    if (!chroma || !colorPicker || !generatedPaletteContainer) return;
    const baseColor = chroma(colorPicker.value);
    // Buat palet dengan beberapa variasi warna menggunakan Chroma.js (analog, gelap, komplementer, dll).
    const palette = [
      baseColor.hex(),
      baseColor.set("hsl.h", "+30").hex(),
      baseColor.darken(1.5).hex(),
      baseColor.set("hsl.h", "+180").hex(),
      baseColor.saturate(2).brighten(1).hex(),
    ];
    renderPalette(generatedPaletteContainer, palette);
  };

  // Menambahkan event listener ke tombol 'Generate Palette'.
  if (generateBtn) {
    generateBtn.addEventListener("click", generatePalette);
  }

  // Menambahkan event listener untuk input file gambar.
  if (imageUploader) {
    imageUploader.addEventListener("change", (e) => {
      const file = e.target.files[0];

      // Gunakan FileReader untuk membaca file gambar dan menampilkannya.
      if (file && imagePreview && ColorThief) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreview.style.display = "block";

          // Setelah gambar dimuat, gunakan ColorThief untuk mengekstrak palet warna.
          imagePreview.onload = () => {
            const colorThief = new ColorThief();
            const paletteRGB = colorThief.getPalette(imagePreview, 5);

            // Ubah format warna dari RGB ke HEX menggunakan Chroma.js.
            const paletteHex = paletteRGB.map((rgb) => chroma(rgb).hex());
            renderPalette(imagePaletteContainer, paletteHex);
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Fungsi untuk memeriksa dan menampilkan rasio kontras antara dua warna.
  const updateContrastChecker = () => {
    if (
      !contrastColor1 ||
      !contrastColor2 ||
      !contrastPreview ||
      !contrastRatioEl ||
      !contrastStatusEl
    )
      return;
    const color1 = contrastColor1.value;
    const color2 = contrastColor2.value;
    contrastPreview.style.color = color1;
    contrastPreview.style.backgroundColor = color2;

    // Menerapkan warna ke elemen pratinjau.
    if (chroma) {
      // Hitung rasio kontras menggunakan Chroma.js.
      const ratio = chroma.contrast(color1, color2);
      contrastRatioEl.textContent = ratio.toFixed(2);

      // Menentukan status kelulusan berdasarkan standar WCAG.
      if (ratio >= 7) {
        contrastStatusEl.textContent = "Legendary";
        contrastStatusEl.style.backgroundColor = "#e77834";
      } else if (ratio >= 4.5) {
        contrastStatusEl.textContent = "Epic";
        contrastStatusEl.style.backgroundColor = "#c700b9";
      } else {
        contrastStatusEl.textContent = "Common";
        contrastStatusEl.style.backgroundColor = "#989898";
      }
    }
  };

  // Menambahkan event listener ke kedua input warna pada pengecek kontras.
  if (contrastColor1) {
    contrastColor1.addEventListener("input", updateContrastChecker);
  }
  if (contrastColor2) {
    contrastColor2.addEventListener("input", updateContrastChecker);
  }

  // Memanggil fungsi-fungsi ini saat halaman pertama kali dimuat untuk menginisialisasi nilai awal.
  if (colorPicker) {
    updateColorPicker(colorPicker.value);
    generatePalette();
    updateContrastChecker();
  }
});
