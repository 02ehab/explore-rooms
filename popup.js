const popup = document.getElementById("popup");
const popupImage = document.getElementById("popupImage");
const closePopupBtn = document.getElementById("closePopup");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const resetZoomBtn = document.getElementById("resetZoom");

let currentImages = [];
let currentIndex = 0;
let currentZoom = 1;

// التحقق من وجود العناصر الأساسية
if (!popup || !popupImage) {
  console.error("خطأ: عناصر الـ popup الأساسية غير موجودة");
}

// دالة مساعدة لإغلاق الـ popup
function closePopup() {
  if (popup) {
    popup.style.display = "none";
    currentZoom = 1;
  }
}

// دالة مساعدة لتحديث الصورة
function updateImage() {
  if (popupImage && currentImages.length > 0) {
    popupImage.src = currentImages[currentIndex];
    popupImage.style.transform = `scale(${currentZoom})`;
    updateImageCounter();
  }
}

// دالة مساعدة لتحديث عداد الصور
function updateImageCounter() {
  const counter = document.getElementById("imageCounter");
  if (counter && currentImages.length > 0) {
    counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
  }
}

// --- فتح Popup ---
window.openPopup = function(images) {
  try {
    if (!images || images.length === 0) {
      console.warn("لا توجد صور للعرض");
      return;
    }
    if (!popup) {
      console.error("الـ popup غير متاح");
      return;
    }
    
    currentImages = images;
    currentIndex = 0;
    currentZoom = 1;
    popup.style.display = "flex";
    updateImage();
  } catch (error) {
    console.error("خطأ في فتح الـ popup:", error);
  }
};

// --- إغلاق Popup ---
if (closePopupBtn) {
  closePopupBtn.addEventListener("click", closePopup);
}

// إغلاق الـ popup عند الضغط خارجها
if (popup) {
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });
}

// --- السابق / التالي ---
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentImages.length > 0) {
      currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
      currentZoom = 1;
      updateImage();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentImages.length > 0) {
      currentIndex = (currentIndex + 1) % currentImages.length;
      currentZoom = 1;
      updateImage();
    }
  });
}

// --- التحكم بالـ Zoom ---
if (zoomInBtn) {
  zoomInBtn.addEventListener("click", () => {
    currentZoom = Math.min(3, currentZoom + 0.2);
    if (popupImage) {
      popupImage.style.transform = `scale(${currentZoom})`;
    }
  });
}

if (zoomOutBtn) {
  zoomOutBtn.addEventListener("click", () => {
    currentZoom = Math.max(0.5, currentZoom - 0.2);
    if (popupImage) {
      popupImage.style.transform = `scale(${currentZoom})`;
    }
  });
}

if (resetZoomBtn) {
  resetZoomBtn.addEventListener("click", () => {
    currentZoom = 1;
    if (popupImage) {
      popupImage.style.transform = `scale(${currentZoom})`;
    }
  });
}

// إغلاق الـ popup عند الضغط على Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && popup && popup.style.display === "flex") {
    closePopup();
  }
});
