import { supabase } from "./supabaseClient.js";

const container = document.getElementById("roomsContainer");

// --- التحقق من وجود العناصر ---
if (!container) {
  console.error("خطأ: لم يتم العثور على roomsContainer");
} else {
  // --- تحميل الغرف ---
  async function loadRooms() {
    try {
      // عرض رسالة التحميل
      container.innerHTML = "<p style='text-align: center; padding: 40px; color: #666;'>جاري التحميل...</p>";

      const { data: rooms, error } = await supabase.from("rooms").select("*");

      if (error) throw error;

      // التحقق من وجود البيانات
      if (!rooms || rooms.length === 0) {
        container.innerHTML = "<p style='text-align: center; padding: 40px; color: #999;'>لا توجد غرف متاحة</p>";
        return;
      }

      // مسح رسالة التحميل
      container.innerHTML = "";

      // عرض الغرف
      rooms.forEach(room => {
        const card = document.createElement("div");
        card.className = "room-card";

        // إنشاء صورة المعاينة
        let imageHTML = "";
        if (room.images && room.images.length > 0) {
          imageHTML = `<img src="${room.images[0]}" alt="غرفة ${room.number}" class="room-image">`;
        }

        // استخدام textContent للنصوص الآمنة من XSS
        card.innerHTML = `
          ${imageHTML}
          <div class="room-info">
            <h3></h3>
            <p class="description"></p>
            <p class="capacity"></p>
          </div>
        `;

        // إضافة النصوص بشكل آمن
        card.querySelector("h3").textContent = `غرفة ${room.number}`;
        card.querySelector(".description").textContent = room.description;
        card.querySelector(".capacity").textContent = `👤 ${room.capacity} أفراد`;

        // التحقق من وجود دالة openPopup قبل استخدامها
        if (room.images && room.images.length > 0) {
          card.style.cursor = "pointer";
          card.addEventListener("click", () => {
            if (typeof window.openPopup === "function") {
              window.openPopup(room.images);
            } else {
              console.error("خطأ: دالة openPopup غير متاحة");
            }
          });
        }

        container.appendChild(card);
      });

    } catch (error) {
      console.error("خطأ في تحميل الغرف:", error);
      container.innerHTML = `<p style='text-align: center; padding: 40px; color: #d32f2f;'>خطأ في تحميل الغرف: ${error.message}</p>`;
    }
  }

  // استدعاء الدالة
  loadRooms();
}
