// الرابط الخاص بـ Google Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRbpRHlHAeWUQChaJ9SToZ2_V7FZh4EJOWiAnfjTxoMhGx7Jhk2lYFrjFhHbAxNCs/exec';

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const coverImageInput = document.getElementById("coverImage");
    const attachmentsInput = document.getElementById("attachments");
    const coverImageBox = document.getElementById("coverImageBox");
    const attachmentsPreview = document.getElementById("attachmentsPreview");

    let coverImageFiles = [];
    let attachmentsFiles = [];

    // دالة لإضافة مربع "+"
    function addAttachmentBox(previewContainer, inputElement) {
        if (!previewContainer.querySelector(".add-attachment")) {
            const addBox = document.createElement("div");
            addBox.classList.add("add-attachment");
            addBox.innerHTML = `<span>+</span>`;
            addBox.addEventListener("click", () => inputElement.click());
            previewContainer.appendChild(addBox);
        }
    }

    // عرض معاينة الصور
    function previewFiles(inputElement, previewContainer, filesArray) {
        previewContainer.innerHTML = ""; // تفريغ المعاينة
        filesArray.forEach((file, index) => {
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
                    filesArray.splice(index, 1);
                    previewFiles(inputElement, previewContainer, filesArray);
                });
            };
            reader.readAsDataURL(file);
        });

        // إضافة مربع "+"
        addAttachmentBox(previewContainer, inputElement);
    }

    // عند اختيار صورة العرض
    if (coverImageInput) {
        coverImageBox.addEventListener("click", () => coverImageInput.click());
        coverImageInput.addEventListener("change", function () {
            coverImageFiles = Array.from(this.files);
            previewFiles(this, coverImageBox, coverImageFiles);
        });
    }

    // عند اختيار المرفقات
    if (attachmentsInput) {
        attachmentsInput.addEventListener("change", function () {
            attachmentsFiles = [...attachmentsFiles, ...Array.from(this.files)];
            previewFiles(this, attachmentsPreview, attachmentsFiles);
        });
    }

    // عند إرسال النموذج
    const form = document.getElementById("propertyForm");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault(); // منع السلوك الافتراضي للنموذج

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
            };

            // رفع صورة العرض
            if (coverImageFiles.length > 0) {
                const formData = new FormData();
                formData.append("file", coverImageFiles[0]);
                formData.append("upload_preset", "ml_default");
                const response = await fetch("https://api.cloudinary.com/v1_1/dm3hmrjvi/image/upload", {
                    method: "POST",
                    body: formData,
                });
                const imageData = await response.json();
                data.coverImage = imageData.secure_url || "";
            }

            // رفع المرفقات
            if (attachmentsFiles.length > 0) {
                const attachmentUrls = [];
                for (const file of attachmentsFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "ml_default");
                    const response = await fetch("https://api.cloudinary.com/v1_1/dm3hmrjvi/image/upload", {
                        method: "POST",
                        body: formData,
                    });
                    const fileData = await response.json();
                    attachmentUrls.push(fileData.secure_url || "");
                }
                data.attachments = attachmentUrls.join(",");
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
