import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../../useContexts/UserContext";
import Swal from "sweetalert2";
import { FaSave, FaTimes, FaImage } from "react-icons/fa";
import "./styleAdvertisementsList.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditAdvertisement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [ad, setAd] = useState({
    title: "",
    description: "",
    images: [],
    priority: 0,
    isActive: true,
    buttonText: "Shop Now",
    link: "/shop"
  });

  // التحقق من الصلاحية وجلب البيانات
  useEffect(() => {
    fetchAd();
  }, [isAdmin, navigate, id]);

  // جلب بيانات الإعلان
  const fetchAd = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/advertisements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const adData = res.data;

      // تحويل الصور إلى الشكل المطلوب
      const imagesObjects = (adData.images || []).map((url) => ({
        url,
        isUploading: false
      }));

      setAd({
        ...adData,
        images: imagesObjects,
        priority: adData.priority || 0
      });
    } catch (err) {
      console.error("Error fetching ad:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء جلب بيانات الإعلان"
      }).then(() => navigate("/dashboard/advertisements"));
    } finally {
      setLoading(false);
    }
  };

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

  // 🖼️ إضافة صور جديدة
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

  // 🗑️ حذف صورة
  const handleRemoveImage = (index) => {
    Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد من حذف هذه الصورة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء"
    }).then((result) => {
      if (result.isConfirmed) {
        setAd((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));

        Swal.fire({
          icon: "success",
          title: "تم الحذف",
          text: "تم حذف الصورة بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // 🔄 استبدال صورة
  const handleReplaceImage = (index) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // عرض حالة التحميل على هذه الصورة فقط
      setAd((prev) => {
        const updatedImages = [...prev.images];
        updatedImages[index] = {
          ...updatedImages[index],
          isUploading: true
        };
        return { ...prev, images: updatedImages };
      });

      try {
        // رفع الصورة الجديدة
        const url = await uploadImageToCloudinary(file);

        // تحديث الصورة
        setAd((prev) => {
          const updatedImages = [...prev.images];
          updatedImages[index] = {
            url: url,
            isUploading: false
          };
          return { ...prev, images: updatedImages };
        });

        Swal.fire({
          icon: "success",
          title: "تم الاستبدال",
          text: "تم استبدال الصورة بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // إزالة حالة التحميل إذا فشل
        setAd((prev) => {
          const updatedImages = [...prev.images];
          updatedImages[index] = {
            ...updatedImages[index],
            isUploading: false
          };
          return { ...prev, images: updatedImages };
        });

        Swal.fire({
          icon: "error",
          title: "فشل الاستبدال",
          text: "حدث خطأ أثناء استبدال الصورة"
        });
      }
    };

    input.click();
  };

  // 📸 ترتيب الصور
  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= ad.images.length) return;

    const updatedImages = [...ad.images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);

    setAd((prev) => ({
      ...prev,
      images: updatedImages
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

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      // تجهيز البيانات
      const adData = {
        title: ad.title,
        description: ad.description,
        images: ad.images.map((img) => img.url),
        priority: parseInt(ad.priority),
        isActive: ad.isActive,
        buttonText: ad.buttonText,
        link: ad.link
      };

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

      navigate("/dashboard/advertisements");
    } catch (err) {
      console.error("Error updating ad:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.message || "حدث خطأ أثناء تحديث الإعلان"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>جاري تحميل بيانات الإعلان...</p>
      </div>
    );
  }

  return (
    <div className="add-ad-container">
      <div className="add-ad-header">
        <h2>تعديل الإعلان</h2>
        <button
          className="close-btn"
          onClick={() => navigate("/dashboard/advertisements")}
        >
          <FaTimes />
        </button>
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

        {/* الصور - النسخة المتطورة */}
        <div className="form-section">
          <h3>🖼️ صور الإعلان</h3>

          {/* زر رفع الصور */}
          <div className="image-upload-area">
            <label htmlFor="image-upload" className="upload-label">
              <FaImage className="upload-icon" />
              <span className="checked-img">اختر صور الإعلان</span>
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

          {/* معرض الصور مع التحكمات الكاملة */}
          {ad.images.length > 0 && (
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
                      <img
                        src={image.url}
                        alt={`ad-${index}`}
                        className="ad-image"
                      />

                      {/* Overlay مع أزرار التحكم */}
                      <div className="image-overlay">
                        {/* زر الاستبدال */}
                        <button
                          type="button"
                          className="image-action-btn replace-btn"
                          onClick={() => handleReplaceImage(index)}
                          title="استبدال الصورة"
                        >
                          🔄
                        </button>

                        {/* زر الحذف */}
                        <button
                          type="button"
                          className="image-action-btn delete-btn"
                          onClick={() => handleRemoveImage(index)}
                          title="حذف الصورة"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* رقم الصورة وأزرار الترتيب */}
                      <div className="image-order">
                        <span className="image-number">{index + 1}</span>
                        <div className="order-buttons">
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                            className="order-btn"
                            title="تحريك لأعلى"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === ad.images.length - 1}
                            className="order-btn"
                            title="تحريك لأسفل"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* رسالة عند عدم وجود صور */}
          {ad.images.length === 0 && (
            <div className="no-images-message">
              <FaImage className="no-image-icon" />
              <p>لا توجد صور مضافة</p>
              <p className="hint">اختر صوراً للإعلان من الأعلى</p>
            </div>
          )}

          {/* عداد الصور */}
          {ad.images.length > 0 && (
            <div className="images-counter">
              <span>عدد الصور: {ad.images.length}</span>
              {uploadingImages && (
                <span className="uploading-badge">جاري الرفع...</span>
              )}
            </div>
          )}
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
            disabled={saving || uploadingImages}
          >
            {saving ? (
              "جاري الحفظ..."
            ) : (
              <>
                <FaSave /> تحديث الإعلان
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
