import { supabase } from "../supabaseClient.js";

const form = document.getElementById("roomForm");
const list = document.getElementById("roomsList");
const messageDiv = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const fileInput = form.images;

let editId = null;
let oldImages = [];

// --- عرض الرسائل ---
function showMessage(text, type = "success") {
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = "block";
  messageDiv.style.backgroundColor = type === "success" ? "#d4edda" : "#f8d7da";
  messageDiv.style.color = type === "success" ? "#155724" : "#721c24";
  messageDiv.style.border = `1px solid ${type === "success" ? "#c3e6cb" : "#f5c6cb"}`;
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// --- حذف الصورة من Supabase Storage ---
async function deleteImage(imageUrl) {
  try {
    const fileName = imageUrl.split("/").pop().split("?")[0];
    const { error } = await supabase.storage
      .from("rooms-images")
      .remove([fileName]);

    if (error) {
      console.error("خطأ في حذف الصورة:", error);
    }
  } catch (error) {
    console.error("خطأ:", error);
  }
}

// --- حذف مجموعة صور قديمة ---
async function deleteOldImages(images) {
  if (!images || images.length === 0) return;
  
  for (const imageUrl of images) {
    await deleteImage(imageUrl);
  }
}

// --- عرض معاينة الصور ---
function updateImagePreview() {
  const preview = document.getElementById("imagePreview");
  const files = fileInput.files;

  if (!preview) {
    // إنشاء عنصر معاينة إذا لم يكن موجوداً
    const previewDiv = document.createElement("div");
    previewDiv.id = "imagePreview";
    previewDiv.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin-top: 10px;
    `;
    form.insertBefore(previewDiv, submitBtn);
  }

  const previewDiv = document.getElementById("imagePreview");
  previewDiv.innerHTML = "";

  for (let file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.cssText = `
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #1e88e5;
      `;
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// --- استماع لتغيير الملفات ---
fileInput.addEventListener("change", updateImagePreview);
async function loadRooms() {
  try {
    const { data, error } = await supabase.from("rooms").select("*");
    if (error) throw error;
    
    list.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach(r => {
        const div = document.createElement("div");
        div.className = "room-item";
        div.innerHTML = `
          <p><strong> ${r.number}</strong></p>
          <p>${r.description}</p>
          <p>👤 ${r.capacity} أفراد</p>
          <button class="edit-btn" data-id="${r.id}">✏️ تعديل</button>
          <button class="delete-btn" data-id="${r.id}">🗑 حذف</button>
        `;
        
        const editBtn = div.querySelector(".edit-btn");
        const deleteBtn = div.querySelector(".delete-btn");
        editBtn.addEventListener("click", () => editRoom(r.id));
        deleteBtn.addEventListener("click", () => deleteRoom(r.id));
        
        list.appendChild(div);
      });
    } else {
      list.innerHTML = "<p>لا توجد غرف</p>";
    }
  } catch (error) {
    console.error("خطأ في تحميل الغرف:", error);
    showMessage("خطأ في تحميل الغرف!", "error");
  }
}

// --- رفع الصورة على Supabase Storage ---
async function uploadImage(file) {
  try {
    // التحقق من نوع الملف
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showMessage("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP", "error");
      return null;
    }

    // التحقق من حجم الملف (5 MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showMessage("حجم الملف كبير جداً. الحد الأقصى 5 MB", "error");
      return null;
    }

    // التعامل مع الملفات بدون extension
    const fileExt = file.name.split(".").pop() || file.type.split("/")[1];
    if (!fileExt) {
      showMessage("خطأ: لم نتمكن من تحديد نوع الملف", "error");
      return null;
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log("جاري رفع الملف:", fileName, "إلى bucket: rooms-images");

    // رفع الملف
    const { data, error: uploadError } = await supabase.storage
      .from("rooms-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("خطأ في الرفع:", uploadError);
      const errorMsg = uploadError.message || JSON.stringify(uploadError);
      
      if (errorMsg.includes("not found") || errorMsg.includes("404")) {
        showMessage("خطأ: Bucket 'rooms-images' غير موجود. يرجى التحقق من إعدادات Supabase", "error");
      } else if (errorMsg.includes("policy") || errorMsg.includes("403") || errorMsg.includes("401")) {
        showMessage("خطأ: لا توجد صلاحيات كافية للرفع. تحقق من RLS policies في Supabase", "error");
      } else {
        showMessage("خطأ في رفع الصورة: " + errorMsg, "error");
      }
      return null;
    }

    console.log("تم رفع الملف بنجاح:", fileName);

    // الحصول على الـ public URL
    const { data: { publicUrl } } = supabase.storage
      .from("rooms-images")
      .getPublicUrl(fileName);

    console.log("الـ URL الرابط:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("خطأ في معالجة الصورة:", error);
    showMessage("خطأ في معالجة الصورة: " + error.message, "error");
    return null;
  }
}

// --- إضافة / تعديل الغرفة ---
form.onsubmit = async (e) => {
  e.preventDefault();

  try {
    // تعطيل الزر أثناء المعالجة
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري المعالجة...";

    const number = form.number.value;
    const description = form.description.value;
    const capacity = parseInt(form.capacity.value);
    const files = fileInput.files;

    let images = [...oldImages]; // ابدأ بالصور القديمة

    // إضافة صور جديدة
    if (files.length > 0) {
      showMessage(`جاري رفع ${files.length} صورة...`, "success");
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        if (url) {
          images.push(url);
          showMessage(`تم رفع ${i + 1} من ${files.length} صور`, "success");
        }
      }
    }

    // التحقق من وجود صور على الأقل
    if (images.length === 0) {
      showMessage("يجب إضافة صورة واحدة على الأقل!", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = editId ? "✏️ تحديث الغرفة" : "حفظ الغرفة";
      return;
    }

    const roomData = { number, description, capacity, images };

    if (editId) {
      const { error } = await supabase.from("rooms").update(roomData).eq("id", editId);
      if (error) throw error;
      
      // حذف الصور القديمة إذا تم استبدالها
      if (files.length > 0) {
        await deleteOldImages(oldImages);
      }
      
      showMessage("تم تحديث الغرفة بنجاح!", "success");
      editId = null;
      oldImages = [];
      cancelEdit();
    } else {
      const { error } = await supabase.from("rooms").insert([roomData]);
      if (error) throw error;
      showMessage("تمت إضافة الغرفة بنجاح!", "success");
    }

    form.reset();
    oldImages = [];
    const preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = "";
    loadRooms();
  } catch (error) {
    console.error("خطأ:", error);
    showMessage("حدث خطأ: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editId ? "✏️ تحديث الغرفة" : "حفظ الغرفة";
  }
};

// --- حذف الغرفة ---
async function deleteRoom(id) {
  if (!confirm("هل تريد حذف هذه الغرفة؟")) return;
  
  try {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) throw error;
    showMessage("تم حذف الغرفة بنجاح!", "success");
    loadRooms();
  } catch (error) {
    console.error("خطأ في الحذف:", error);
    showMessage("خطأ في حذف الغرفة!", "error");
  }
}

// --- تعديل الغرفة ---
async function editRoom(id) {
  try {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", id).single();
    if (error) throw error;
    
    form.number.value = data.number;
    form.description.value = data.description;
    form.capacity.value = data.capacity;
    
    // حفظ الصور القديمة للاستخدام لاحقاً
    oldImages = data.images || [];
    
    // عرض معاينة الصور القديمة
    const previewDiv = document.getElementById("imagePreview") || (() => {
      const div = document.createElement("div");
      div.id = "imagePreview";
      div.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        margin-top: 10px;
      `;
      form.insertBefore(div, submitBtn);
      return div;
    })();
    
    previewDiv.innerHTML = "<p style='grid-column: 1/-1; color: #666; font-size: 0.9rem;'>صور الغرفة الحالية:</p>";
    oldImages.forEach(imageUrl => {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.cssText = `
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #4caf50;
        opacity: 0.7;
      `;
      previewDiv.appendChild(img);
    });
    
    editId = id;
    submitBtn.textContent = "✏️ تحديث الغرفة";
    cancelBtn.style.display = "inline";
    form.number.focus();
  } catch (error) {
    console.error("خطأ في التعديل:", error);
    showMessage("خطأ في تحميل بيانات الغرفة!", "error");
  }
}

// --- إلغاء التعديل ---
function cancelEdit() {
  editId = null;
  oldImages = [];
  form.reset();
  const preview = document.getElementById("imagePreview");
  if (preview) preview.innerHTML = "";
  submitBtn.textContent = "حفظ الغرفة";
  cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", cancelEdit);

loadRooms();


