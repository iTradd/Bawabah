// الرابط الخاص بـ Google Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_URL/exec';

// رفع ملف واحد إلى Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
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

// تحديث معاينة الصور
function updatePreview(previewContainer, fileArray, allowAddAttachment = false, inputElement = null) {
    previewContainer.innerHTML = ''; // تفريغ المعاينة السابقة

    fileArray.forEach((fileUrl, index) => {
        const container = document.createElement("div");
        container.classList.add("image-container");
        container.innerHTML = `
            <img src="${fileUrl}" alt="معاينة">
            <button class="close-btn" data-index="${index}">&times;</button>
        `;
        previewContainer.appendChild(container);

        // حذف الصورة عند النقر على زر الحذف
        container.querySelector(".close-btn").addEventListener("click", () => {
            fileArray.splice(index, 1);
            updatePreview(previewContainer, fileArray, allowAddAttachment, inputElement);
        });
    });

    // إضافة مربع "+" إذا كان مسموحًا
    if (allowAddAttachment && inputElement) {
        const addAttachmentBox = document.createElement("div");
        addAttachmentBox.classList.add("add-attachment");
        addAttachmentBox.innerHTML = `<span>+ </span>`;
        addAttachmentBox.addEventListener("click", () => inputElement.click());
        previewContainer.appendChild(addAttachmentBox);
    }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const propertyTypeElement = document.getElementById("propertyType");
    const coverImageInput = document.getElementById("coverImage");
    const attachmentsInput = document.getElementById("attachments");
    const coverImageBox = document.getElementById("coverImageBox");
    const attachmentsPreview = document.getElementById("attachmentsPreview");
    let coverImageUrls = []; // روابط صور العرض
    let attachmentsUrls = []; // روابط المرفقات

    // إعداد الحقول الديناميكية
    if (propertyTypeElement) {
        propertyTypeElement.addEventListener("change", updateDynamicFields);
    }

    // رفع صورة العرض مباشرة عند الاختيار
    if (coverImageInput) {
        coverImageInput.addEventListener("change", async function () {
            const files = Array.from(this.files);
            for (const file of files) {
                const url = await uploadToCloudinary(file);
                if (url) coverImageUrls = [url]; // استبدال الصورة السابقة
            }
            updatePreview(coverImageBox, coverImageUrls, false, coverImageInput);
        });
    }

    // رفع المرفقات مباشرة عند الاختيار
    if (attachmentsInput) {
        attachmentsInput.addEventListener("change", async function () {
            const files = Array.from(this.files);
            for (const file of files) {
                const url = await uploadToCloudinary(file);
                if (url) attachmentsUrls.push(url); // إضافة إلى القائمة
            }
            updatePreview(attachmentsPreview, attachmentsUrls, true, attachmentsInput);
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
                coverImage: coverImageUrls[0] || "",
                attachments: attachmentsUrls.join(","),
            };

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
