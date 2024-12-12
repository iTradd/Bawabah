// قراءة قيمة API_URL من متغير البيئة
const apiUrl = process.env.API_URL;

// استخدام المتغير
fetch(`${apiUrl}?action=getProperties&sheet=Real_Estate`)
    .then(response => response.json())
    .then(data => console.log(data)) // يمكنك استبدال console.log بعملية أخرى لمعالجة البيانات
    .catch(error => console.error('Error fetching properties:', error));
