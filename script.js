// الرابط الجديد الخاص بـ Cloudflare Worker
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

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const propertyTypeElement = document.getElementById("propertyType");
    if (propertyTypeElement) {
        propertyTypeElement.addEventListener("change", updateDynamicFields);
    }

    const coverImageInput = document.getElementById("coverImage");
    const attachmentsInput = document.getElementById("attachments");
    const form = document.getElementById("propertyForm");

    // عرض معاينة الصور
    function previewFiles(inputElement, previewContainer) {
        const files = Array.from(inputElement.files);

        // إزالة الصور الحالية مع ترك مربع الإضافة
        const existingImages = previewContainer.querySelectorAll(".image-container");
        existingImages.forEach((img) => {
            if (!img.classList.contains("add-attachment")) {
                img.remove();
            }
        });

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = document.createElement("div");
                container.classList.add("image-container");
                container.innerHTML = `
                    <img src="${e.target.result}" alt="معاينة">
                    <button class="close-btn">&times;</button>
                `;
                previewContainer.insertBefore(container, previewContainer.querySelector(".add-attachment"));

                // حذف المرفق عند النقر على الزر
                container.querySelector(".close-btn").addEventListener("click", () => {
                    container.remove();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // عند رفع صورة العرض
    if (coverImageInput) {
        const coverImageBox = document.getElementById("coverImageBox");
        coverImageBox.addEventListener("click", () => {
            coverImageInput.click(); // فتح نافذة اختيار الملفات لصورة العرض
        });

        coverImageInput.addEventListener("change", function () {
            const previewContainer = document.getElementById("coverImageBox");
            previewFiles(this, previewContainer);
        });
    }

    // عند رفع المرفقات
    if (attachmentsInput) {
        const attachmentsPreview = document.getElementById("attachmentsPreview");
        const addAttachmentBox = attachmentsPreview.querySelector(".add-attachment");
        addAttachmentBox.addEventListener("click", () => {
            attachmentsInput.click(); // فتح نافذة اختيار الملفات للمرفقات
        });

        attachmentsInput.addEventListener("change", function () {
            previewFiles(this, attachmentsPreview);
        });
    }

    // عند إرسال النموذج
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

            console.log("Final Data to Server:", data);

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
