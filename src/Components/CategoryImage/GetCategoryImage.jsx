// // categoryImages.js
// // هذا الملف يربط كل تصنيف بصورة معينة بدون حاجة لقاعدة البيانات

// // export const getCategoryImage = (slug) => {
// //   // خريطة (Map) بين اسم التصنيف والصورة
// //   const imagesMap = {
// //     // التصنيفات التي ذكرتها في ملفك
// //     "All products": "../../../public/Images/logoSmartGearStore.jpg",
// //     SmartWitch: "../../../public/Images/logoSmartGearStore.jpg",
// //     الشفاء: "/images/categories/healing.jpg",

// //     // أضف باقي تصنيفاتك هنا
// //     سماعات: "/images/categories/headphones.jpg",
// //     ساعات: "/images/categories/watches.jpg",
// //     لابتوب: "/images/categories/laptops.jpg",
// //     إضاءة: "/images/categories/lighting.jpg",
// //     كشافات: "/images/categories/flashlights.jpg",

// //     // صورة افتراضية إذا لم يجد التصنيف
// //     default: "/images/categories/default.jpg"
// //   };

// //   return imagesMap[slug] || imagesMap["default"];
// // };
// // GetCategoryImage.jsx
// import {
//   FaMobileAlt,
//   FaMicrophone,
//   FaHeadphones,
//   FaChargingStation,
//   FaWind,
//   FaBroom,
//   FaMugHot,
//   FaPlug,
//   FaMobile,
//   FaTablet,
//   FaLaptop,
//   FaDesktop,
//   FaClock,
//   FaLightbulb,
//   FaBatteryFull,
//   FaMusic,
//   FaDrumstickBite,
//   FaLeaf,
//   FaPills,
//   FaBoxOpen,
//   FaCamera,
//   // FaScooter,
//   // FaHardDrive,
//   FaHeartbeat,
//   FaMagic,
//   FaCut
// } from 'react-icons/fa';

// export const getCategoryIconComponent = (slug) => {
//   const iconsMap = {
//     // الأجهزة الذكية
//     "SmartWitch": { icon: FaMobileAlt, color: "#667eea" },
//     "phone": { icon: FaMobileAlt, color: "#3b82f6" },
//     "Mobile cover": { icon: FaMobile, color: "#8b5cf6" },

//     // الشحن والكابلات
//     "Charger & Cable": { icon: FaChargingStation, color: "#f59e0b" },
//     "Power Bank": { icon: FaBatteryFull, color: "#22c55e" },

//     // الصوتيات
//     "headphones": { icon: FaHeadphones, color: "#ef4444" },
//     "Speakers": { icon: FaMusic, color: "#ec4899" },
//     "Microphones": { icon: FaMicrophone, color: "#06b6d4" },

//     // المنزل والمطبخ
//     "Air freshener": { icon: FaWind, color: "#14b8a6" },
//     "Coffee making machine": { icon: FaMugHot, color: "#78350f" },
//     "Floor cleaning machine": { icon: FaBroom, color: "#0ea5e9" },

//     // الإضاءة
//     "Lighting & Lamps": { icon: FaLightbulb, color: "#fbbf24" },

//     // التخزين
//     // "Storage devices": { icon: FaHardDrive, color: "#6b7280" },

//     // العناية الشخصية والجمال
//     "Lifestyle": { icon: FaHeartbeat, color: "#f43f5e" },
//     "Self Care & Beauty": { icon: FaLeaf, color: "#10b981" },
//     "Shaving machines": { icon: FaCut, color: "#8b5cf6" },

//     // الإلكترونيات الأخرى
//     "Holder": { icon: FaMobile, color: "#a855f7" },
//     "DJI Collection": { icon: FaCamera, color: "#000000" },
//     // "Scooter": { icon: FaScooter, color: "#22c55e" },

//     // المراوح والتهوية
//     "Fans & Ventilation": { icon: FaWind, color: "#0ea5e9" },

//     // افتراضي
//     "default": { icon: FaBoxOpen, color: "#9ca3af" }
//   };

//   return iconsMap[slug] || iconsMap["default"];
// };

// // إذا كنت تريد استخدام الصور بدلاً من الأيقونات
// export const getCategoryImage = (slug) => {
//   const imagesMap = {
//     "SmartWitch": "https://cdn-icons-png.flaticon.com/512/1055/1055685.png",
//     "phone": "https://cdn-icons-png.flaticon.com/512/1055/1055685.png",
//     "Mobile cover": "https://cdn-icons-png.flaticon.com/512/1055/1055685.png",

//     "Charger & Cable": "https://cdn-icons-png.flaticon.com/512/3106/3106774.png",
//     "Power Bank": "https://cdn-icons-png.flaticon.com/512/3106/3106774.png",

//     "headphones": "https://cdn-icons-png.flaticon.com/512/3393/3393881.png",
//     "Speakers": "https://cdn-icons-png.flaticon.com/512/727/727245.png",
//     "Microphones": "https://cdn-icons-png.flaticon.com/512/2527/2527827.png",

//     "Air freshener": "https://cdn-icons-png.flaticon.com/512/3095/3095121.png",
//     "Coffee making machine": "https://cdn-icons-png.flaticon.com/512/924/924514.png",
//     "Floor cleaning machine": "https://cdn-icons-png.flaticon.com/512/2951/2951372.png",

//     "Lighting & Lamps": "https://cdn-icons-png.flaticon.com/512/1250/1250627.png",

//     "Storage devices": "https://cdn-icons-png.flaticon.com/512/2948/2948720.png",

//     "Lifestyle": "https://cdn-icons-png.flaticon.com/512/2922/2922561.png",
//     "Self Care & Beauty": "https://cdn-icons-png.flaticon.com/512/2922/2922561.png",
//     "Shaving machines": "https://cdn-icons-png.flaticon.com/512/4656/4656959.png",

//     "Holder": "https://cdn-icons-png.flaticon.com/512/4209/4209792.png",
//     "DJI Collection": "https://cdn-icons-png.flaticon.com/512/4141/4141696.png",
//     "Scooter": "https://cdn-icons-png.flaticon.com/512/2935/2935945.png",

//     "Fans & Ventilation": "https://cdn-icons-png.flaticon.com/512/2019/2019029.png",

//     "default": "https://cdn-icons-png.flaticon.com/512/1077/1077035.png"
//   };

//   return imagesMap[slug] || imagesMap["default"];
// };

// GetCategoryImage.jsx - نسخة الصور

export const getCategoryImage = (slug) => {
  const imagesMap = {
    // الأجهزة الذكية
    "ساعات ذكية":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwWEvbszgUVMWipa8lXCSmh92qquJeMV2zLQ&s",
    هواتف: "https://image.made-in-china.com/203f0j00iSBVCZUlfDRn/blog.jpg",
    "كفرات هواتف":
      "https://m.media-amazon.com/images/I/71gpJc2WYgL._AC_SX679_.jpg",

    // الشحن والكابلات
    "شواحن & وصلات شحن":
      "https://m.media-amazon.com/images/I/51IBD0OubAL._AC_SY879_.jpg",
    "شاحن متنقل":
      "https://m.media-amazon.com/images/I/61G7FF9sxpL._AC_SX679_.jpg",

    // الصوتيات
    سماعات: "https://www.wellypaudio.com/uploads/anc-tws-earbuds.jpg",
    "مكبرات صوت":
      "https://ar.litoscreen.com/uploadfile/202404/16/cb3003a1213290b16fa5ce92923f13b8_medium.jpg",
    مايكروفونات:
      "https://m.media-amazon.com/images/I/71QWkcCgMZL._AC_SX679_.jpg",

    // المنزل والمطبخ
    // "Air freshener": "https://cdn-icons-png.flaticon.com/512/3095/3095121.png",
    "ماكينات تحضير القهوة":
      "https://www.xmart.jo/cdn/shop/collections/CM3037BS_1_1771155457-800x800.webp?v=1773372139&width=640",
    "مكانس كهربائية":
      "https://m.media-amazon.com/images/I/61vlMM-SsXL._AC_SX569_.jpg",

    // الإضاءة
    "إضاءة ومصابيح":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIyJw6RgC4xxr-ss8pgpriIO7EFJtf2Be4IQ&s",

    // التخزين
    "أجهزة تخزين":
      "https://cdn.taw9eel.com/media/catalog/category/cache/2/image/519x/0efc8192e1d7edf2c5d64aded49d4c94/1-22_3_1.jpg",

    // العناية الشخصية والجمال
    "منتجات متنوعة":
      "https://cdn.salla.sa/xQjRb/sflaW7B9ySB0WczEC2wTRXguNw9iss1TDIrXXSXP.jpg",
    "أجهزة العناية الشخصية والجمال":
      "https://cdn.salla.sa/lWaen/13285779-f9ca-482d-9140-35ef2279663a-881.47497805092x1000-5hyROrGxHHZJBANCfhIHJVosj0WnTytWVwZl6mqV.jpg",
    "ماكينات حلاقة":
      "https://m.media-amazon.com/images/I/41XFNPl+s6L._SL500_.jpg",

    // الإلكترونيات الأخرى
    "حوامل جوال": "https://m.media-amazon.com/images/I/71KAyReiSdL.jpg",
    "معدات تصوير":
      "https://www.virginmegastore.om/medias/372804-main.jpg?context=bWFzdGVyfHJvb3R8NjY3MjZ8aW1hZ2UvanBlZ3xhRFU0TDJnM1lpOHhNRE00TmpBMk9EWXpOVFkzT0M4ek56STRNRFJmWDIxaGFXNHVhbkJufDA0NzgyMzM0NDYyMTRhODQ4Mzk4NWRlYzcyMjY0ZmU4NGQ4MmJmYzZkN2I4ZDkyMTFhYTRiNGI1YmU0NjI3ZDk",
    // Scooter: "https://m.media-amazon.com/images/I/61RWA1td5cL._AC_SX679_.jpg",
    "سكوتر كهربائي":
      "https://cdn.salla.sa/ZqZQY/c932d2da-c7c6-4b46-8042-a81177c2765d-1000x1000-4HNtneYGOillRGLGy2unolm4a6gjc97uiOR0rky2.jpg",

    // المراوح والتهوية
    "مراوح وتهوية":
      "https://i5.walmartimages.com/asr/fe12dafc-30fa-4446-a181-b1628dbc28ea.f32a4beb719347ff97ff4086ab7463cd.jpeg",

    // صورة افتراضية
    default: "https://cdn-icons-png.flaticon.com/512/1077/1077035.png"
  };

  return imagesMap[slug] || imagesMap["default"];
};
