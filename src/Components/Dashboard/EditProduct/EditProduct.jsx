import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./styleEditProduct.css";
import { useContext } from "react";
import { UserContext } from "../../../useContexts/UserContext";
import { useNavigate, useParams } from "react-router-dom";

// ICONS
import {
  FaSave,
  FaTimes,
  FaTrash,
  FaPlus,
  FaImage,
  FaEdit
} from "react-icons/fa";
import { MdOutlineLocalOffer, MdStar, MdStarBorder } from "react-icons/md";
import { IoColorPaletteOutline, IoImageOutline } from "react-icons/io5";
import { FaTag } from "react-icons/fa";

// ثوابت للتحسين
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dfcyr6kyu/image/upload";
const UPLOAD_PRESET = "ml_default";

export default function EditProduct({
  productId: propProductId,
  onClose,
  onProductUpdated
}) {
  const params = useParams();
  const productId = propProductId || params.id;
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Refs للتحسين
  const isMounted = useRef(true);
  const hasFetchedData = useRef(false);
  const fileInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    images: [],
    color: [],
    categoryId: "",
    rating: 0,
    brand: "",
    stock: "",
    isFeatured: false
  });

  // حالة لإضافة الألوان
  const [newColor, setNewColor] = useState("");

  // Cleanup على unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // التحقق من التوكن
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "تسجيل الدخول مطلوب",
        text: "يرجى تسجيل الدخول للوصول إلى لوحة التحكم",
        confirmButtonText: "تسجيل الدخول"
      }).then(() => {
        window.location.href = "/login";
      });
    }
  }, []);

  // دالة جلب التصنيفات - محسنة
  const fetchCategories = useCallback(async () => {
    if (categoriesLoading) return;

    setCategoriesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categorys`);
      if (isMounted.current) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("خطأ في جلب التصنيفات:", err);
      if (isMounted.current) {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "حدث خطأ أثناء جلب التصنيفات",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } finally {
      if (isMounted.current) {
        setCategoriesLoading(false);
      }
    }
  }, [categoriesLoading]);

  // جلب بيانات المنتج والتصنيفات
  useEffect(() => {
    const fetchData = async () => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;

      try {
        // جلب التصنيفات أولاً
        await fetchCategories();

        // إذا كان هناك productId، جلب بيانات المنتج
        if (productId) {
          const productRes = await axios.get(
            `${API_BASE_URL}/api/products/${productId}`
          );

          if (isMounted.current) {
            // تحويل الصور من مصفوفة نصوص إلى كائنات
            const imagesObjects = (productRes.data.images || []).map((url) => ({
              url: url,
              publicId: null,
              isUploading: false,
              isNew: false
            }));

            setProduct({
              ...productRes.data,
              images: imagesObjects,
              price: productRes.data.price.toString(),
              discountPrice: productRes.data.discountPrice?.toString() || "",
              stock: productRes.data.stock.toString(),
              rating: productRes.data.rating || 0
            });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted.current) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "حدث خطأ أثناء جلب البيانات"
          });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [productId, fetchCategories]);

  // ⬆️ دوال رفع الصور إلى Cloudinary
  const uploadImageToCloudinary = useCallback(async (file, index) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress((prev) => ({ ...prev, [index]: percentCompleted }));
        }
      });

      setUploadProgress((prev) => ({ ...prev, [index]: 100 }));

      return {
        url: res.data.secure_url,
        publicId: res.data.public_id
      };
    } catch (err) {
      console.error("خطأ في رفع الصورة:", err);
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));
      throw err;
    }
  }, []);

  // 🖼️ دالة إضافة صورة جديدة
  const handleAddImage = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setUploadingImages(true);

      const newImages = files.map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        publicId: null,
        isUploading: true,
        isNew: true
      }));

      setProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));

      const uploadPromises = files.map(async (file, idx) => {
        const imageIndex = product.images.length + idx;

        try {
          const { url, publicId } = await uploadImageToCloudinary(
            file,
            imageIndex
          );

          setProduct((prev) => {
            const updatedImages = [...prev.images];
            const indexToUpdate = updatedImages.findIndex(
              (img) => img.file === file || img.url?.startsWith("blob:")
            );

            if (indexToUpdate !== -1) {
              updatedImages[indexToUpdate] = {
                url: url,
                publicId: publicId,
                isUploading: false,
                isNew: true
              };
            }

            return { ...prev, images: updatedImages };
          });
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          setProduct((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img.file !== file)
          }));

          Swal.fire({
            icon: "error",
            title: "فشل رفع الصورة",
            text: `فشل رفع الصورة: ${file.name}`,
            timer: 1500,
            showConfirmButton: false
          });
        }
      });

      await Promise.all(uploadPromises);
      setUploadingImages(false);
      setUploadProgress({});

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [product.images.length, uploadImageToCloudinary]
  );

  // 🔄 دالة استبدال صورة
  const handleReplaceImage = useCallback(
    async (file, index) => {
      if (!file) return;

      setProduct((prev) => {
        const updatedImages = [...prev.images];
        updatedImages[index] = {
          ...updatedImages[index],
          isUploading: true
        };
        return { ...prev, images: updatedImages };
      });

      try {
        const { url, publicId } = await uploadImageToCloudinary(file, index);

        setProduct((prev) => {
          const updatedImages = [...prev.images];
          updatedImages[index] = {
            url: url,
            publicId: publicId,
            isUploading: false,
            isNew: true
          };
          return { ...prev, images: updatedImages };
        });

        Swal.fire({
          icon: "success",
          title: "تم استبدال الصورة",
          timer: 1000,
          showConfirmButton: false
        });
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setProduct((prev) => {
          const updatedImages = [...prev.images];
          updatedImages[index] = {
            ...updatedImages[index],
            isUploading: false
          };
          return { ...prev, images: updatedImages };
        });

        Swal.fire({
          icon: "error",
          title: "فشل استبدال الصورة",
          text: "يرجى المحاولة مرة أخرى",
          timer: 1500,
          showConfirmButton: false
        });
      }
    },
    [uploadImageToCloudinary]
  );

  // 🗑️ دالة حذف صورة
  const handleRemoveImage = useCallback(async (index) => {
    const result = await Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد من حذف هذه الصورة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء"
    });

    if (!result.isConfirmed) return;

    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    Swal.fire({
      icon: "success",
      title: "تم الحذف",
      text: "تم حذف الصورة بنجاح",
      timer: 1000,
      showConfirmButton: false
    });
  }, []);

  // 📝 دالة فتح نافذة استبدال الصورة
  const handleReplaceClick = useCallback(
    (index) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          handleReplaceImage(file, index);
        }
      };

      input.click();
    },
    [handleReplaceImage]
  );

  // دوال التعامل مع النموذج
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }, []);

  const handleAddColor = useCallback(() => {
    if (newColor && !product.color.includes(newColor)) {
      setProduct((prev) => ({
        ...prev,
        color: [...prev.color, newColor]
      }));
      setNewColor("");
    }
  }, [newColor, product.color]);

  const handleRemoveColor = useCallback((colorToRemove) => {
    setProduct((prev) => ({
      ...prev,
      color: prev.color.filter((c) => c !== colorToRemove)
    }));
  }, []);

  const handleRatingChange = useCallback((rating) => {
    setProduct((prev) => ({ ...prev, rating }));
  }, []);

  // دالة آمنة للإغلاق
  const safeClose = useCallback(() => {
    if (onClose && typeof onClose === "function") {
      onClose();
    } else {
      navigate("/dashboard/productsList");
    }
  }, [onClose, navigate]);

  // التحقق من صحة البيانات
  const validateForm = useCallback(() => {
    if (!product.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال اسم المنتج",
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }
    if (!product.description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال وصف المنتج",
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }
    if (!product.price || parseFloat(product.price) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال سعر صحيح للمنتج",
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }
    if (!product.categoryId) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى اختيار تصنيف للمنتج",
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }
    if (!product.stock || parseInt(product.stock) < 0) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال كمية صحيحة للمخزون",
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }
    return true;
  }, [product]);

  // حفظ التعديلات
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const hasUploading = product.images.some((img) => img.isUploading);
      if (hasUploading) {
        Swal.fire({
          icon: "warning",
          title: "تنبيه",
          text: "يرجى الانتظار حتى اكتمال رفع جميع الصور",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      setSaving(true);

      try {
        const token = localStorage.getItem("token");

        if (!user || user.role !== "admin") {
          await Swal.fire({
            icon: "error",
            title: "غير مصرح",
            text: "يجب أن تكون مسؤولاً لإضافة أو تعديل المنتجات"
          });
          return;
        }

        if (!token) {
          await Swal.fire({
            icon: "warning",
            title: "تسجيل الدخول مطلوب",
            text: "يجب تسجيل الدخول أولاً لإجراء هذه العملية"
          });
          return;
        }

        const imagesUrls = product.images
          .filter((img) => !img.isUploading && img.url)
          .map((img) => img.url);

        const productData = {
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          discountPrice: product.discountPrice
            ? parseFloat(product.discountPrice)
            : 0,
          images: imagesUrls,
          color: product.color || [],
          categoryId: product.categoryId,
          rating: parseFloat(product.rating) || 0,
          brand: product.brand || "",
          stock: parseInt(product.stock) || 0,
          isFeatured: product.isFeatured || false
        };

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        };

        if (productId) {
          await axios.put(
            `${API_BASE_URL}/api/products/${productId}`,
            productData,
            config
          );
          await Swal.fire({
            icon: "success",
            title: "تم التحديث",
            text: "تم تحديث المنتج بنجاح",
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          await axios.post(`${API_BASE_URL}/api/products`, productData, config);
          await Swal.fire({
            icon: "success",
            title: "تم الإضافة",
            text: "تم إضافة المنتج بنجاح",
            timer: 1500,
            showConfirmButton: false
          });
        }

        if (onProductUpdated && typeof onProductUpdated === "function") {
          onProductUpdated();
        }

        safeClose();
      } catch (err) {
        console.error("Error saving product:", err);

        let errorMessage = "حدث خطأ أثناء حفظ المنتج";

        if (err.response?.status === 401) {
          errorMessage = "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى";
        } else if (err.response?.status === 403) {
          errorMessage = "ليس لديك صلاحية للقيام بهذه العملية";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        await Swal.fire({
          icon: "error",
          title: "خطأ",
          text: errorMessage
        });
      } finally {
        setSaving(false);
      }
    },
    [product, productId, user, onProductUpdated, safeClose, validateForm]
  );

  // Skeleton Loader
  const renderSkeleton = useCallback(
    () => (
      <div className="edit-product-modal">
        <div className="edit-product-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>جاري تحميل بيانات المنتج...</p>
          </div>
        </div>
      </div>
    ),
    []
  );

  // تحسين عرض التصنيفات
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.name || cat.slug}
      </option>
    ));
  }, [categories]);

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="edit-product-modal">
      <div className="edit-product-content">
        <div className="edit-product-header">
          <h2>{productId ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
          <button type="button" className="close-btn" onClick={safeClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-product-form">
          <div className="form-grid">
            {/* المعلومات الأساسية */}
            <div className="form-section">
              <h3 className="section-title">
                <FaTag /> المعلومات الأساسية
              </h3>

              <div className="form-group">
                <label>اسم المنتج</label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  required
                  placeholder="أدخل اسم المنتج"
                />
              </div>

              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="أدخل وصف المنتج"
                  dir="auto"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>العلامة التجارية</label>
                  <input
                    type="text"
                    name="brand"
                    value={product.brand}
                    onChange={handleChange}
                    placeholder="أدخل العلامة التجارية"
                  />
                </div>

                <div className="form-group">
                  <label>التصنيف</label>
                  <select
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">اختر تصنيف</option>
                    {categoryOptions}
                  </select>
                </div>
              </div>
            </div>

            {/* الأسعار والمخزون */}
            <div className="form-section">
              <h3 className="section-title">
                <MdOutlineLocalOffer /> الأسعار والمخزون
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>السعر</label>
                  <input
                    type="number"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>السعر بعد الخصم</label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={product.discountPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>المخزون</label>
                  <input
                    type="number"
                    name="stock"
                    value={product.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={product.isFeatured}
                      onChange={handleChange}
                    />
                    منتج مميز
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>التقييم</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className="rating-star"
                    >
                      {star <= product.rating ? (
                        <MdStar className="star-filled" />
                      ) : (
                        <MdStarBorder className="star-empty" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* الألوان */}
            <div className="form-section">
              <h3 className="section-title">
                <IoColorPaletteOutline /> الألوان المتاحة
              </h3>

              <div className="color-input-group">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="أدخل اللون"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="add-btn"
                >
                  <FaPlus /> إضافة
                </button>
              </div>

              <div className="colors-list">
                {product.color.map((color, index) => (
                  <div key={index} className="color-item">
                    <span
                      className="color-preview"
                      style={{ backgroundColor: color }}
                    />
                    <span className="color-name">{color}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className="remove-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {product.color.length === 0 && (
                  <p className="empty-message">لا توجد ألوان مضافة</p>
                )}
              </div>
            </div>

            {/* قسم الصور - النسخة المطورة */}
            <div className="form-section">
              <h3 className="section-title">
                <IoImageOutline /> صور المنتج
              </h3>

              {/* زر رفع الصور */}
              <div className="image-upload-area">
                <label htmlFor="image-upload" className="upload-label">
                  <FaImage className="upload-icon" />
                  <span className="checked-img">اختر صوراً للمنتج</span>
                  <span className="upload-hint">(يمكنك اختيار عدة صور)</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAddImage}
                  style={{ display: "none" }}
                  disabled={uploadingImages}
                />
              </div>

              {/* معرض الصور */}
              <div className="images-grid">
                {product.images.map((image, index) => (
                  <div key={index} className="image-item">
                    {image.isUploading ? (
                      <div className="image-uploading">
                        <div className="spinner-small"></div>
                        {uploadProgress[index] > 0 && (
                          <span className="upload-progress">
                            {uploadProgress[index]}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <img
                          src={image.url}
                          alt={`product-${index}`}
                          className="product-image"
                          loading="lazy"
                        />
                        <div className="image-overlay">
                          <button
                            type="button"
                            className="image-action-btn replace-btn"
                            onClick={() => handleReplaceClick(index)}
                            title="استبدال الصورة"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="image-action-btn delete-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="حذف الصورة"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* زر إضافة صور إضافية */}
                {product.images.length > 0 && !uploadingImages && (
                  <label className="image-item add-more-btn">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddImage}
                      style={{ display: "none" }}
                    />
                    <FaPlus />
                    <span>إضافة المزيد</span>
                  </label>
                )}
              </div>

              {/* رسالة عند عدم وجود صور */}
              {product.images.length === 0 && (
                <p className="empty-message">
                  لا توجد صور مضافة. اختر صوراً للمنتج
                </p>
              )}

              {/* مؤشر عدد الصور */}
              {product.images.length > 0 && (
                <div className="images-counter">
                  عدد الصور: {product.images.length}
                  {uploadingImages && " (جاري رفع الصور...)"}
                </div>
              )}
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="form-actions">
            <button type="button" onClick={safeClose} className="cancel-btn">
              <FaTimes /> إلغاء
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span> جاري الحفظ...
                </>
              ) : (
                <>
                  <FaSave /> {productId ? "تحديث المنتج" : "إضافة المنتج"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
