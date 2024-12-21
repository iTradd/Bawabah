// الرابط الخاص بـ Google Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRbpRHlHAeWUQChaJ9SToZ2_V7FZh4EJOWiAnfjTxoMhGx7Jhk2lYFrjFhHbAxNCs/exec';

// دالة تحديث الحقول الديناميكية
function updateDynamicFields() {
    const propertyType = document.getElementById('propertyType').value;
    const dynamicFields = document.getElementById('dynamicFields');
    dynamicFields.innerHTML = '';

    if (['شقة', 'فلة', 'دور', 'شاليه'].includes(propertyType)) {
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label for="rooms">عدد الغرف:</label>
                <input type="text" id="rooms" name="rooms" placeholder="عدد الغرف" required>
            </div>
            <div class="form-group">
                <label for="bathrooms">عدد الحمامات:</label>
                <input type="text" id="bathrooms" name="bathrooms" placeholder="عدد الحمامات" required>
            </div>`;
    } else if (['أرض', 'مزرعة'].includes(propertyType)) {
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label for="usage">استخدام العقار:</label>
                <input type="text" id="usage" name="usage" placeholder="استخدام العقار" required>
            </div>
            <div class="form-group">
                <label for="streetCount">عدد الشوارع:</label>
                <input type="text" id="streetCount" name="streetCount" placeholder="عدد الشوارع" required>
            </div>`;
    } else if (propertyType === 'محل') {
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label for="shopArea">مساحة المحل:</label>
                <input type="text" id="shopArea" name="shopArea" placeholder="المساحة بالمتر المربع" required>
            </div>
            <div class="form-group">
                <label for="openings">عدد الفتحات:</label>
                <input type="text" id="openings" name="openings" placeholder="عدد الفتحات" required>
            </div>`;
    }
}

// عرض معاينة الصور
function previewFiles(files, previewContainer, fileArray, allowAddAttachment = false, inputElement = null) {
    previewContainer.innerHTML = ''; // تفريغ المعاينة السابقة
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement("div");
            container.classList.add("image-container");
            container.innerHTML = `
                <img src="${e.target.result}" alt="معاينة">
                <button class="close-btn" data-index="${index}">&times;</button>
            `;
            previewContainer.appendChild(container);

            // حذف الصورة عند النقر على زر الحذف
            container.querySelector(".close-btn").addEventListener("click", () => {
                fileArray.splice(index, 1);
                previewFiles(fileArray, previewContainer, fileArray, allowAddAttachment, inputElement);
            });
        };
        reader.readAsDataURL(file);
    });

    // إضافة مربع الإضافة إذا كان مسموحًا
    if (allowAddAttachment && inputElement) {
        const addAttachmentBox = document.createElement("div");
        addAttachmentBox.classList.add("add-attachment");
        addAttachmentBox.innerHTML = `<span>+ </span>`;
        addAttachmentBox.addEventListener("click", () => inputElement.click());
        previewContainer.appendChild(addAttachmentBox);
    }
}

// رفع الملفات إلى Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/dm3hmrjvi/image/upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        return data.secure_url || null;
    } catch (error) {
        console.error("فشل رفع الملف:", error.message);
        return null;
    }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const propertyTypeElement = document.getElementById("propertyType");
    const coverImageInput = document.getElementById("coverImage");
    const attachmentsInput = document.getElementById("attachments");
    const coverImageBox = document.getElementById("coverImageBox");
    const attachmentsPreview = document.getElementById("attachmentsPreview");
    let coverImageFiles = [];
    let attachmentsFiles = [];

    // إعداد الحقول الديناميكية
    if (propertyTypeElement) {
        propertyTypeElement.addEventListener("change", updateDynamicFields);
    }

    // عند اختيار صورة العرض
    if (coverImageInput) {
        coverImageBox.addEventListener("click", () => coverImageInput.click());
        coverImageInput.addEventListener("change", function () {
            coverImageFiles = Array.from(this.files);
            previewFiles(coverImageFiles, coverImageBox, coverImageFiles);
        });
    }

    // عند اختيار المرفقات
    if (attachmentsInput) {
        attachmentsInput.addEventListener("change", function () {
            attachmentsFiles = [...attachmentsFiles, ...Array.from(this.files)];
            previewFiles(attachmentsFiles, attachmentsPreview, attachmentsFiles, true, attachmentsInput);
        });
    }

    // عند إرسال النموذج
    const form = document.getElementById("propertyForm");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const data = {
                action: "addProperty",
                sheet: "Real_Estate",
                name: document.getElementById("propertyName").value,
                type: document.getElementById("propertyType").value,
                price: document.getElementById("price").value,
                ownerName: document.getElementById("ownerName").value,
                ownerContact: document.getElementById("ownerContact").value,
                location: document.getElementById("propertyLocation").value,
                mapLocation: document.getElementById("mapLocation").value,
                description: document.getElementById("propertyDescription").value,
                area: document.getElementById("propertyArea").value,
                streetWidth: document.getElementById("streetWidth").value,
                front: document.getElementById("propertyFront").value,
                rooms: document.getElementById("rooms")?.value || "",
                bathrooms: document.getElementById("bathrooms")?.value || "",
                usage: document.getElementById("usage")?.value || "",
                streetCount: document.getElementById("streetCount")?.value || "",
                shopArea: document.getElementById("shopArea")?.value || "",
                openings: document.getElementById("openings")?.value || "",
            };

            // رفع صورة العرض
            if (coverImageFiles.length > 0) {
                const url = await uploadToCloudinary(coverImageFiles[0]);
                if (url) data.coverImage = url;
            }

            // رفع المرفقات
            if (attachmentsFiles.length > 0) {
                const urls = [];
                for (const file of attachmentsFiles) {
                    const url = await uploadToCloudinary(file);
                    if (url) urls.push(url);
                }
                data.attachments = urls.join(",");
            }

            // إرسال البيانات إلى Google Script
            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                const result = await response.json();
                if (result.status === "success") {
                    alert("تم حفظ العقار بنجاح!");
                } else {
                    alert("فشل الحفظ: " + result.message);
                }
            } catch (error) {
                console.error("خطأ أثناء حفظ البيانات:", error.message);
                alert("حدث خطأ أثناء حفظ البيانات.");
            }
        });
    }
});
