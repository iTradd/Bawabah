// الرابط الجديد الخاص بـ Cloudflare Worker
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwq2lOi4KBk1ef_-7bhDMzabEKsnF7qdtHtdejyrh-oUwZrimpZsZvtjkLPGiTrikk6/exec';

//Javascript for Property!!

 // تحديث الحقول الديناميكية
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

            document.addEventListener("DOMContentLoaded", () => {
    // عند اختيار نوع العقار
    const propertyTypeElement = document.getElementById("propertyType");
    if (propertyTypeElement) {
        propertyTypeElement.addEventListener("change", updateDynamicFields);
    }

    const coverImageInput = document.getElementById("coverImage");
    const attachmentsInput = document.getElementById("attachments");
    const form = document.getElementById("propertyForm");

    console.log("coverImageInput:", coverImageInput);
    console.log("attachmentsInput:", attachmentsInput);

    // دالة لإعادة تعيين ملف الإدخال
    function resetFileInput(fileInput) {
        const newInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInput, fileInput);
        return newInput;
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
            if (!data.secure_url) throw new Error("فشل رفع الملف إلى Cloudinary");
            return data.secure_url;
        } catch (error) {
            console.error("خطأ في رفع الملف:", error.message);
            return null;
        }
    }

    // عرض معاينة الصور
    function previewFiles(inputElement, previewContainer) {
        const files = Array.from(inputElement.files);
        previewContainer.innerHTML = ""; // تفريغ المعاينة السابقة

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

                // حذف المرفق عند النقر على الزر
                container.querySelector(".close-btn").addEventListener("click", () => {
                    container.remove();
                    inputElement.files = removeFileFromList(inputElement.files, index);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // إزالة ملف معين من FileList
    function removeFileFromList(fileList, indexToRemove) {
        const dt = new DataTransfer();
        Array.from(fileList).forEach((file, index) => {
            if (index !== indexToRemove) dt.items.add(file);
        });
        return dt.files;
    }

    let coverUrl = "";
    const attachmentUrls = [];

    // عند رفع صورة العرض
    if (coverImageInput) {
        coverImageInput.addEventListener("change", function () {
            const previewContainer = document.getElementById("coverImageBox");
            previewFiles(this, previewContainer);
        });
    }

    // عند رفع المرفقات
    if (attachmentsInput) {
        attachmentsInput.addEventListener("change", function () {
            const previewContainer = document.getElementById("attachmentsPreview");
            previewFiles(this, previewContainer);
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
                coverImage: coverUrl || "",
                attachments: attachmentUrls.join(",") || "",
            };

            // رفع صورة العرض
            if (coverImageInput.files.length > 0) {
                const coverUrl = await uploadToCloudinary(coverImageInput.files[0]);
                if (coverUrl) data.coverImage = coverUrl;
            }

            // رفع المرفقات
            if (attachmentsInput.files.length > 0) {
                const attachmentUrls = [];
                for (const file of attachmentsInput.files) {
                    const url = await uploadToCloudinary(file);
                    if (url) attachmentUrls.push(url);
                }
                data.attachments = attachmentUrls.join(",");
            }

            console.log("Final Data to Server:", data);

            try {
                const response = await fetch("https://script.google.com/macros/s/AKfycbzRbpRHlHAeWUQChaJ9SToZ2_V7FZh4EJOWiAnfjTxoMhGx7Jhk2lYFrjFhHbAxNCs/exec", {
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


     
