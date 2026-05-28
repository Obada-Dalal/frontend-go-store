import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../../useContexts/UserContext";
import "./styleAddProduct.css";

// ICONS
import {
  FaSave,
  FaTimes,
  FaTrash,
  FaPlus,
  FaImage,
  FaTag,
  FaCheck,
  FaEdit,
  FaFolderOpen
} from "react-icons/fa";
import { MdStar, MdStarBorder } from "react-icons/md";
import {
  IoColorPaletteOutline,
  IoImageOutline,
  IoPricetagOutline
} from "react-icons/io5";
import { BiDetail, BiCategory } from "react-icons/bi";
import { GrAddCircle } from "react-icons/gr";
import { RiPriceTag3Line, RiDeleteBinLine } from "react-icons/ri";

// ثوابت للتحسين
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dfcyr6kyu/image/upload";
const UPLOAD_PRESET = "ml_default";

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: ""
  });
  const [addingCategory, setAddingCategory] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);

  // حالة المنتج الجديد
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

  // حالة لرفع الصور
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // حالة للمعاينة
  const [previewMode, setPreviewMode] = useState(false);

  // Refs للتحسين
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // ✅ useCallback للدوال - منع إعادة الإنشاء غير الضرورية
  const fetchCategories = useCallback(async () => {
    if (categoriesLoading) return;

    setCategoriesLoading(true);
    try {
      console.log("جاري جلب التصنيفات...");
      const res = await axios.get(`${API_BASE_URL}/api/categorys`);
      console.log("عدد التصنيفات:", res.data.length);
      setCategories(res.data);
    } catch (err) {
      console.error("خطأ في جلب التصنيفات:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء جلب التصنيفات",
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // ✅ جلب التصنيفات عند تحميل الصفحة
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // التحقق من صلاحية المستخدم
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "تسجيل الدخول مطلوب",
        text: "يرجى تسجيل الدخول للوصول إلى لوحة التحكم",
        confirmButtonText: "تسجيل الدخول"
      }).then(() => {
        navigate("/login");
      });
    }
  }, [user, navigate]);

  // التعامل مع تغيير الحقول
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }, []);

  // إضافة لون جديد
  const handleAddColor = useCallback(() => {
    if (newColor && !product.color.includes(newColor)) {
      setProduct((prev) => ({
        ...prev,
        color: [...prev.color, newColor]
      }));
      setNewColor("");
    }
  }, [newColor, product.color]);

  // حذف لون
  const handleRemoveColor = useCallback((colorToRemove) => {
    setProduct((prev) => ({
      ...prev,
      color: prev.color.filter((c) => c !== colorToRemove)
    }));
  }, []);

  // تغيير التقييم
  const handleRatingChange = useCallback((rating) => {
    setProduct((prev) => ({ ...prev, rating }));
  }, []);

  // التعامل مع تغيير حقول التصنيف الجديد
  const handleNewCategoryChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // بدء تعديل تصنيف
  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name || "",
      slug: category.slug || ""
    });
    setShowAddCategory(true);
  }, []);

  // تحديث تصنيف
  const handleUpdateCategory = useCallback(async () => {
    if (!newCategory.slug.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال الرابط (slug)",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setUpdatingCategory(true);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      };

      const categoryData = {
        name: newCategory.name || newCategory.slug,
        slug: newCategory.slug
      };

      const res = await axios.put(
        `${API_BASE_URL}/api/categorys/${editingCategory._id}`,
        categoryData,
        config
      );

      setCategories((prev) =>
        prev.map((cat) => (cat._id === editingCategory._id ? res.data : cat))
      );

      setEditingCategory(null);
      setShowAddCategory(false);
      setNewCategory({ name: "", slug: "" });

      Swal.fire({
        icon: "success",
        title: "تم التحديث",
        text: "تم تحديث التصنيف بنجاح",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error updating category:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "حدث خطأ أثناء تحديث التصنيف",
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setUpdatingCategory(false);
    }
  }, [newCategory, editingCategory]);

  // حذف تصنيف
  const handleDeleteCategory = useCallback(
    async (categoryId) => {
      const result = await Swal.fire({
        title: "تأكيد الحذف",
        text: "هل أنت متأكد من حذف هذا التصنيف؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "نعم، احذف",
        cancelButtonText: "إلغاء"
      });

      if (!result.isConfirmed) return;

      try {
        const token = localStorage.getItem("token");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        await axios.delete(
          `${API_BASE_URL}/api/categorys/${categoryId}`,
          config
        );

        setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));

        if (product.categoryId === categoryId) {
          setProduct((prev) => ({ ...prev, categoryId: "" }));
        }

        Swal.fire({
          icon: "success",
          title: "تم الحذف",
          text: "تم حذف التصنيف بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Error deleting category:", err);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "حدث خطأ أثناء حذف التصنيف",
          timer: 2000,
          showConfirmButton: false
        });
      }
    },
    [product.categoryId]
  );

  // إضافة تصنيف جديد
  const handleAddCategory = useCallback(async () => {
    if (!newCategory.slug.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال الرابط (slug)",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setAddingCategory(true);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      };

      const categoryData = {
        name: newCategory.name || newCategory.slug,
        slug: newCategory.slug
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/categorys`,
        categoryData,
        config
      );

      setCategories((prev) => [...prev, res.data]);
      setProduct((prev) => ({ ...prev, categoryId: res.data._id }));
      setShowAddCategory(false);
      setNewCategory({ name: "", slug: "" });

      Swal.fire({
        icon: "success",
        title: "تم الإضافة",
        text: "تم إضافة التصنيف بنجاح",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error adding category:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "حدث خطأ أثناء إضافة التصنيف",
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setAddingCategory(false);
    }
  }, [newCategory]);

  // إلغاء إضافة/تعديل تصنيف
  const handleCancelCategoryForm = useCallback(() => {
    setShowAddCategory(false);
    setEditingCategory(null);
    setNewCategory({ name: "", slug: "" });
  }, []);

  // ⬆️ دوال رفع الصور إلى Cloudinary
  const uploadImageToCloudinary = useCallback(async (file, index) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      // محاكاة تقدم الرفع
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

      // رفع كل صورة على حدة مع تحديد الأولوية
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
            isNew: prev.images[index]?.isNew || true
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

  // حفظ المنتج
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

        await axios.post(`${API_BASE_URL}/api/products`, productData, config);

        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة المنتج بنجاح",
          timer: 1500,
          showConfirmButton: false
        });

        navigate("/dashboard/productsList");
      } catch (err) {
        console.error("Error saving product:", err);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "حدث خطأ أثناء إضافة المنتج",
          timer: 2000,
          showConfirmButton: false
        });
      } finally {
        setSaving(false);
      }
    },
    [product, validateForm, navigate]
  );

  // إلغاء والعودة
  const handleCancel = useCallback(() => {
    navigate("/dashboard/productsList");
  }, [navigate]);

  // البحث عن اسم التصنيف المختار - useMemo للتحسين
  const getCategoryDisplayName = useCallback((cat) => {
    if (!cat) return "غير محدد";
    return cat.slug || cat.name || "غير محدد";
  }, []);

  const selectedCategoryName = useMemo(() => {
    if (!product.categoryId) return "غير محدد";
    const category = categories.find((c) => c._id === product.categoryId);
    return getCategoryDisplayName(category);
  }, [product.categoryId, categories, getCategoryDisplayName]);

  // Skeleton Loader للتصنيفات
  const renderCategorySkeletons = useCallback(() => {
    return [...Array(3)].map((_, i) => (
      <div key={i} className="category-card skeleton">
        <div className="category-info">
          <div
            className="skeleton-text"
            style={{ width: "100px", height: "16px" }}
          ></div>
          <div
            className="skeleton-text small"
            style={{ width: "60px", height: "12px", marginTop: "5px" }}
          ></div>
        </div>
        <div className="category-actions">
          <div
            className="skeleton-btn"
            style={{ width: "30px", height: "30px" }}
          ></div>
          <div
            className="skeleton-btn"
            style={{ width: "30px", height: "30px" }}
          ></div>
          <div
            className="skeleton-btn"
            style={{ width: "50px", height: "30px" }}
          ></div>
        </div>
      </div>
    ));
  }, []);

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h2>
          <FaPlus /> إضافة منتج جديد
        </h2>
        <button type="button" className="close-btn" onClick={handleCancel}>
          <FaTimes />
        </button>
      </div>

      <div className="add-product-tabs">
        <button
          className={`tab-btn ${!previewMode ? "active" : ""}`}
          onClick={() => setPreviewMode(false)}
        >
          <BiDetail /> بيانات المنتج
        </button>
        <button
          className={`tab-btn ${previewMode ? "active" : ""}`}
          onClick={() => setPreviewMode(true)}
        >
          <FaImage /> معاينة
        </button>
      </div>

      {previewMode ? (
        // وضع المعاينة
        <div className="preview-section">
          <h3>معاينة المنتج</h3>
          <div className="preview-card">
            <div className="preview-image">
              {product.images.length > 0 && product.images[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  loading="lazy"
                />
              ) : (
                <div className="no-image">
                  <FaImage /> لا توجد صورة
                </div>
              )}
            </div>
            <div className="preview-details">
              <h4>{product.name || "اسم المنتج"}</h4>
              <p className="preview-brand">
                {product.brand || "العلامة التجارية"}
              </p>
              <p className="preview-description">
                {product.description || "وصف المنتج"}
              </p>
              <div className="preview-price">
                {product.discountPrice &&
                parseFloat(product.discountPrice) <
                  parseFloat(product.price) ? (
                  <>
                    <span className="discount-price">
                      ${product.discountPrice}
                    </span>
                    <span className="original-price">${product.price}</span>
                  </>
                ) : (
                  <span className="price">${product.price || "0"}</span>
                )}
              </div>
              <div className="preview-colors">
                <span>الألوان:</span>
                <div className="color-dots">
                  {product.color.map((color, index) => (
                    <span
                      key={index}
                      className="color-dot"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div className="preview-stock">
                المخزون: <span>{product.stock || "0"}</span>
              </div>
              <div className="preview-category">
                <span>{selectedCategoryName}</span>: التصنيف
              </div>
            </div>
          </div>
        </div>
      ) : (
        // نموذج إضافة المنتج
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="add-product-form"
        >
          <div className="form-grid">
            {/* المعلومات الأساسية */}
            <div className="form-section">
              <h3 className="section-title">
                <FaTag /> المعلومات الأساسية
              </h3>

              <div className="form-group">
                <label>
                  اسم المنتج <span className="required">*</span>
                </label>
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
                <label>
                  الوصف <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="أدخل وصف المنتج"
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
              </div>
            </div>

            {/* قسم التصنيفات */}
            <div className="form-section">
              <h3 className="section-title">
                <BiCategory /> إدارة التصنيفات
              </h3>

              {/* عرض التصنيفات الحالية */}
              <div className="categories-list-section">
                <div className="categories-header">
                  <span>التصنيفات المتاحة ({categories.length})</span>
                </div>

                <div className="categories-grid">
                  {categoriesLoading
                    ? renderCategorySkeletons()
                    : categories.map((cat) => (
                        <div key={cat._id} className="category-card">
                          <div className="category-info">
                            <span className="category-name">{cat.slug}</span>
                            {cat.name && cat.name !== cat.slug && (
                              <span className="category-slug">
                                ({cat.name})
                              </span>
                            )}
                          </div>
                          <div className="category-actions">
                            <button
                              type="button"
                              className="category-edit-btn"
                              onClick={() => handleEditCategory(cat)}
                              title="تعديل"
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="category-delete-btn"
                              onClick={() => handleDeleteCategory(cat._id)}
                              title="حذف"
                            >
                              <RiDeleteBinLine />
                            </button>
                            <button
                              type="button"
                              className={`category-select-btn ${product.categoryId === cat._id ? "selected" : ""}`}
                              onClick={() =>
                                setProduct((prev) => ({
                                  ...prev,
                                  categoryId: cat._id
                                }))
                              }
                              title="اختيار"
                            >
                              {product.categoryId === cat._id
                                ? "✓ مختار"
                                : "اختر"}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* نموذج إضافة/تعديل تصنيف */}
              <div className="add-category-section">
                {!showAddCategory ? (
                  <button
                    type="button"
                    className="add-category-main-btn"
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategory({ name: "", slug: "" });
                      setShowAddCategory(true);
                    }}
                  >
                    <GrAddCircle /> إضافة تصنيف جديد
                  </button>
                ) : (
                  <div className="add-category-form">
                    <h4>
                      {editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
                    </h4>
                    <div className="form-group">
                      <label>
                        الرابط (slug) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={newCategory.slug}
                        onChange={handleNewCategoryChange}
                        placeholder="category-slug"
                        className="category-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>الاسم (اختياري)</label>
                      <input
                        type="text"
                        name="name"
                        value={newCategory.name}
                        onChange={handleNewCategoryChange}
                        placeholder="أدخل اسم التصنيف"
                        className="category-input"
                      />
                    </div>
                    <div className="category-form-actions">
                      <button
                        type="button"
                        className="save-category-btn"
                        onClick={
                          editingCategory
                            ? handleUpdateCategory
                            : handleAddCategory
                        }
                        disabled={addingCategory || updatingCategory}
                      >
                        {addingCategory || updatingCategory ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <>
                            <FaCheck /> {editingCategory ? "تحديث" : "حفظ"}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="cancel-category-btn"
                        onClick={handleCancelCategoryForm}
                      >
                        <FaTimes /> إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* عرض التصنيف المختار */}
              {product.categoryId && (
                <div className="selected-category-display">
                  <span>
                    <strong>{selectedCategoryName}</strong> :التصنيف المختار
                  </span>
                </div>
              )}
            </div>

            {/* الأسعار والمخزون */}
            <div className="form-section">
              <h3 className="section-title">
                <IoPricetagOutline /> الأسعار والمخزون
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    السعر <span className="required">*</span>
                  </label>
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
                  <label>
                    المخزون <span className="required">*</span>
                  </label>
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
                  placeholder="أدخل اللون "
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

            {/* قسم الصور */}
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
            <button type="button" onClick={handleCancel} className="cancel-btn">
              <FaTimes /> إلغاء
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span> جاري الحفظ...
                </>
              ) : (
                <>
                  <FaSave /> إضافة المنتج
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
