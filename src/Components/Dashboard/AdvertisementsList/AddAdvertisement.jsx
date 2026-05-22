import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../../useContexts/UserContext";
import Swal from "sweetalert2";
import { FaSave, FaTimes, FaImage, FaTrash } from "react-icons/fa";

import "./styleAdvertisementsList.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddAdvertisement() {
  const navigate = useNavigate();
  const { id } = useParams();
  // const { isAdmin } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [ad, setAd] = useState({
    title: "",
    description: "",
    images: [], // مصفوفة كائنات { url, file, isUploading }
    startDate: "",
    endDate: "",
    priority: 0,
    isActive: true,
    buttonText: "Shop Now",
    link: "/shop"
  });

  // التحقق من الصلاحية
  // if (!isAdmin) {
  //   Swal.fire({
  //     icon: "error",
  //     title: "غير مصرح",
  //     text: "هذه الصفحة للمسؤولين فقط"
  //   }).then(() => navigate("/dashboard"));
  // }

  // ⬆️ رفع الصور إلى Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dfcyr6kyu/image/upload",
        formData
      );
      return res.data.secure_url;
    } catch (err) {
      console.error("خطأ في رفع الصورة:", err);
      throw err;
    }
  };

  const handleAddImage = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);

    // إضافة الصور مع حالة التحميل
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isUploading: true
    }));

    setAd((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));

    // رفع كل صورة
    for (const file of files) {
      try {
        const url = await uploadImageToCloudinary(file);

        setAd((prev) => {
          const updatedImages = [...prev.images];
          const index = updatedImages.findIndex((img) => img.file === file);
          if (index !== -1) {
            updatedImages[index] = { url, isUploading: false };
          }
          return { ...prev, images: updatedImages };
        });
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setAd((prev) => ({
          ...prev,
          images: prev.images.filter((img) => img.file !== file)
        }));

        Swal.fire({
          icon: "error",
          title: "فشل الرفع",
          text: `فشل رفع الصورة: ${file.name}`
        });
      }
    }

    setUploadingImages(false);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setAd((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAd((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الصور المرفوعة
    const hasUploading = ad.images.some((img) => img.isUploading);
    if (hasUploading) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى الانتظار حتى اكتمال رفع الصور"
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // تجهيز البيانات
      const adData = {
        title: ad.title,
        description: ad.description,
        images: ad.images.map((img) => img.url), // روابط فقط
        startDate: ad.startDate,
        endDate: ad.endDate,
        priority: parseInt(ad.priority),
        isActive: ad.isActive,
        buttonText: ad.buttonText,
        link: ad.link
      };

      if (id) {
        // تعديل
        await axios.put(`${API_BASE_URL}/api/advertisements/${id}`, adData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث الإعلان بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // إضافة
        await axios.post(`${API_BASE_URL}/api/advertisements`, adData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة الإعلان بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      }

      navigate("/dashboard/advertisements");
    } catch (err) {
      console.error("Error saving ad:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.message || "حدث خطأ أثناء حفظ الإعلان"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ad-container">
      <div className="add-ad-header">
        <button
          className="close-btn"
          onClick={() => navigate("/dashboard/advertisements")}
        >
          <FaTimes />
        </button>
        <h2>{id ? "تعديل الإعلان" : "إعلان جديد"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="add-ad-form">
        {/* المعلومات الأساسية */}
        <div className="form-section">
          <h3>📝 المعلومات الأساسية</h3>

          <div className="form-group">
            <label>عنوان الإعلان *</label>
            <input
              type="text"
              name="title"
              value={ad.title}
              onChange={handleChange}
              required
              placeholder="مثال: Next-Level Gaming Starts Here"
            />
          </div>

          <div className="form-group">
            <label>الوصف</label>
            <textarea
              name="description"
              value={ad.description}
              onChange={handleChange}
              rows="3"
              placeholder="وصف الإعلان..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>نص الزر</label>
              <input
                type="text"
                name="buttonText"
                value={ad.buttonText}
                onChange={handleChange}
                placeholder="Shop Now"
              />
            </div>

            <div className="form-group">
              <label>رابط الزر</label>
              <input
                type="text"
                name="link"
                value={ad.link}
                onChange={handleChange}
                placeholder="/shop"
              />
            </div>
          </div>
        </div>

        {/* التاريخ والأولوية */}
        <div className="form-section">
          <h3>📅 التاريخ والأولوية</h3>

          <div className="form-row">
            <div className="form-group">
              <label>تاريخ البداية *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={ad.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>تاريخ النهاية *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={ad.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>الأولوية</label>
              <input
                type="number"
                name="priority"
                value={ad.priority}
                onChange={handleChange}
                min="0"
                max="100"
              />
              <small>كلما زاد الرقم، كلما ظهر الإعلان أولاً</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={ad.isActive}
                  onChange={handleChange}
                />
                الإعلان نشط
              </label>
            </div>
          </div>
        </div>

        {/* الصور */}
        <div className="form-section">
          <h3>🖼️ صور الإعلان</h3>

          <div className="image-upload-area">
            <label htmlFor="image-upload" className="upload-label">
              <FaImage className="upload-icon" />
              <span>اختر صور الإعلان</span>
              <span className="upload-hint">(يمكنك اختيار عدة صور)</span>
            </label>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleAddImage}
              style={{ display: "none" }}
              disabled={uploadingImages}
            />
          </div>

          <div className="images-grid">
            {ad.images.map((image, index) => (
              <div key={index} className="image-item">
                {image.isUploading ? (
                  <div className="image-uploading">
                    <div className="spinner-small"></div>
                    <span>جاري الرفع...</span>
                  </div>
                ) : (
                  <>
                    <img src={image.url} alt={`ad-${index}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            ))}

            {ad.images.length === 0 && (
              <p className="empty-message">لا توجد صور مضافة</p>
            )}
          </div>
        </div>

        {/* الأزرار */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/dashboard/advertisements")}
          >
            <FaTimes /> إلغاء
          </button>
          <button
            type="submit"
            className="save-btn"
            disabled={loading || uploadingImages}
          >
            {loading ? (
              "جاري الحفظ..."
            ) : (
              <>
                <FaSave /> {id ? "تحديث" : "نشر الإعلان"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
