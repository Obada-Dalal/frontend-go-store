import "./styleProductList.css";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// ICONS
import {
  FaDollarSign,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxOpen,
  FaTimes
} from "react-icons/fa";
import {
  MdOutlineInventory,
  MdOutlineAttachMoney,
  MdOutlineWarning
} from "react-icons/md";

// ثوابت 
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [deletingId, setDeletingId] = useState(null);

  // Refs للتحسين
  const searchInputRef = useRef(null);
  const isMounted = useRef(true);

  // دالة لجلب المنتجات - محسنة مع useCallback
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`);

      if (isMounted.current) {
        setProducts(res.data);

        const total = res.data.length;
        const inStock = res.data.filter((p) => p.stock > 10).length;
        const lowStock = res.data.filter(
          (p) => p.stock > 0 && p.stock <= 10
        ).length;
        const outOfStock = res.data.filter((p) => p.stock === 0).length;

        setStats({ total, inStock, lowStock, outOfStock });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      if (isMounted.current) {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "حدث خطأ أثناء جلب المنتجات",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Cleanup على unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ دالة حذف المنتج - محسنة
  const handleDeleteProduct = useCallback(
    async (productId, productName) => {
      const result = await Swal.fire({
        title: "تأكيد الحذف",
        html: `هل أنت متأكد من حذف المنتج <strong>${productName}</strong>؟`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "نعم، احذف",
        cancelButtonText: "إلغاء",
        reverseButtons: true
      });

      if (!result.isConfirmed) return;

      setDeletingId(productId);

      try {
        const token = localStorage.getItem("token");

        await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted.current) {
          setProducts((prev) => prev.filter((p) => p._id !== productId));
          setStats((prev) => ({
            ...prev,
            total: prev.total - 1,
            inStock:
              prev.inStock -
              (products.find((p) => p._id === productId)?.stock > 10 ? 1 : 0),
            lowStock:
              prev.lowStock -
              (products.find((p) => p._id === productId)?.stock > 0 &&
              products.find((p) => p._id === productId)?.stock <= 10
                ? 1
                : 0),
            outOfStock:
              prev.outOfStock -
              (products.find((p) => p._id === productId)?.stock === 0 ? 1 : 0)
          }));

          Swal.fire({
            icon: "success",
            title: "تم الحذف",
            text: "تم حذف المنتج بنجاح",
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (err) {
        console.error("Error deleting product:", err);

        let errorMessage = "حدث خطأ أثناء حذف المنتج";

        if (err.response?.status === 401) {
          errorMessage = "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى";
        } else if (err.response?.status === 403) {
          errorMessage = "ليس لديك صلاحية لحذف المنتجات";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        if (isMounted.current) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: errorMessage,
            confirmButtonText: "حسناً"
          });
        }
      } finally {
        if (isMounted.current) {
          setDeletingId(null);
        }
      }
    },
    [products]
  );

  // دالة للانتقال إلى صفحة التعديل
  const handleEditClick = useCallback(
    (productId) => {
      navigate(`/dashboard/EditProduct/${productId}`);
    },
    [navigate]
  );

  // دالة للانتقال إلى صفحة إضافة منتج
  const handleAddProduct = useCallback(() => {
    navigate("/dashboard/addProduct");
  }, [navigate]);

  // فلترة المنتجات - useMemo للتحسين
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const searchLower = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
    );
  }, [products, searchTerm]);

  // دوال مساعدة - useCallback
  const getStockStatus = useCallback((stock) => {
    if (stock === 0) return { text: "غير متوفر", class: "out-stock" };
    if (stock <= 10) return { text: "مخزون منخفض", class: "low-stock" };
    return { text: "متوفر", class: "in-stock" };
  }, []);

  const getStockPercentage = useCallback((stock) => {
    const maxStock = 100;
    return Math.min((stock / maxStock) * 100, 100);
  }, []);

  // Skeleton Loader
  const renderSkeletons = useCallback(() => {
    return [...Array(6)].map((_, index) => (
      <div key={index} className="skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    ));
  }, []);

  if (loading) {
    return (
      <div className="all-product">
        <div className="products-header">
          <h1>المنتجات</h1>
        </div>
        <div className="products-grid">{renderSkeletons()}</div>
      </div>
    );
  }

  return (
    <div className="all-product">
      {/* Header */}
      <div className="products-header">
        <h1>المنتجات</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="... بحث عن منتج"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="search-icon" />
            {searchTerm && (
              <button
                className="clear-search product-list"
                onClick={() => setSearchTerm("")}
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button className="add-product-btn" onClick={handleAddProduct}>
            <FaPlus /> إضافة منتج
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card all">
          <div className="stat-icon">
            <FaBoxOpen />
          </div>
          <div className="stat-info product-list">
            <h3>إجمالي المنتجات</h3>
            <p>{stats.total}</p>
          </div>
        </div>

        <div className="stat-card available">
          <div className="stat-icon">
            <MdOutlineInventory />
          </div>
          <div className="stat-info product-list">
            <h3>متوفر</h3>
            <p style={{ color: "#10b981" }}>{stats.inStock}</p>
          </div>
        </div>

        <div className="stat-card low">
          <div className="stat-icon">
            <MdOutlineWarning />
          </div>
          <div className="stat-info product-list">
            <h3>مخزون منخفض</h3>
            <p style={{ color: "#f59e0b" }}>{stats.lowStock}</p>
          </div>
        </div>

        <div className="stat-card unavailable">
          <div className="stat-icon">
            <MdOutlineAttachMoney />
          </div>
          <div className="stat-info product-list">
            <h3>غير متوفر</h3>
            <p style={{ color: "#ef4444" }}>{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <FaBoxOpen />
          <h3>لا توجد منتجات</h3>
          <p>لم يتم العثور على منتجات مطابقة لبحثك</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts
            .slice()
            .reverse()
            .map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const stockPercentage = getStockPercentage(product.stock);
              const isDeleting = deletingId === product._id;

              return (
                <div
                  className={`product-card ${isDeleting ? "deleting" : ""}`}
                  key={product._id}
                >
                  <div className="productlist-image">
                    <img
                      src={
                        product.images?.[0] || "https://via.placeholder.com/300"
                      }
                      alt={product.name}
                      loading="lazy"
                    />
                    <span className={`stock-badge ${stockStatus.class}`}>
                      {stockStatus.text}
                    </span>
                  </div>

                  <div className="product-content">
                    <div className="product-header">
                      <h4 className="name-dash">{product.name}</h4>
                    </div>

                    <p className="product-brand">{product.brand}</p>

                    {product.category && (
                      <span className="product-category">
                        {product.category}
                      </span>
                    )}

                    <div className="price-section">
                      <div className="price-container">
                        {product.discountPrice &&
                        product.discountPrice < product.price ? (
                          <>
                            <span className="discount-price">
                              <FaDollarSign />
                              {product.discountPrice}
                            </span>
                            <span className="original-price">
                              <FaDollarSign />
                              {product.price}
                            </span>
                            <span className="discount-badge-products-list">
                              خصم
                              {Math.round(
                                (1 - product.discountPrice / product.price) *
                                  100
                              )}
                              %
                            </span>
                          </>
                        ) : (
                          <span className="regular-price">
                            <FaDollarSign />
                            {product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stock-info">
                      <span>المخزون: {product.stock}</span>
                      <div className="stock-bar">
                        <div
                          className={`stock-fill ${stockStatus.class}`}
                          style={{ width: `${stockPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="product-actions">
                      <button
                        className="edit-btn product-list"
                        onClick={() => handleEditClick(product._id)}
                        disabled={isDeleting}
                      >
                        <FaEdit /> تعديل
                      </button>
                      <button
                        className="delete-btn product-list"
                        onClick={() =>
                          handleDeleteProduct(product._id, product.name)
                        }
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <FaTrash />
                        )}{" "}
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
