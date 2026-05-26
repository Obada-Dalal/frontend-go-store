import "./styleCategoryImage.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Icons
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// استيراد دالة الصور
import { getCategoryImage } from "./GetCategoryImage";

// ثابت للـ API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CategoryImage({ onSearchSelect }) {
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true); // بدأنا بتحميل
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorys`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (e, slug) => {
    e.preventDefault();
    navigate(`/products/${slug}`, { state: { fromLink: true } });
    if (onSearchSelect) {
      onSearchSelect(null);
    }
    setTimeout(() => {
      const productsSection =
        document.getElementById("products-section") ||
        document.getElementById("all-products");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleAllProductsClick = (e) => {
    e.preventDefault();
    navigate("/products", { state: { fromLink: true } });
    if (onSearchSelect) {
      onSearchSelect(null);
    }
    setTimeout(() => {
      const productsSection =
        document.getElementById("products-section") ||
        document.getElementById("all-products");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const showMoreCategories = () => {
    setVisibleCount(categories.length);
  };

  const showLessCategories = () => {
    setVisibleCount(9);
  };

  // ========== Skeleton Loader ==========
  const renderSkeletons = () => {
    // 10 عناصر تحاكي بطاقة "جميع المنتجات" + 9 تصنيفات
    return Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="category-card-circle skeleton-circle">
        <div className="category-icon-circle skeleton-circle-icon"></div>
        <div className="category-name-circle skeleton-circle-text"></div>
      </div>
    ));
  };

  // ========== حالة التحميل ==========
  if (loading) {
    return (
      <div className="categories-section">
        <div className="categories-container-grid">
          <div className="categories-header">
            <span className="categories-count skeleton-count"></span>
          </div>
          <div className="categories-grid-image">{renderSkeletons()}</div>
        </div>
      </div>
    );
  }

  const visibleCategories = categories.slice(0, visibleCount);
  const hasMore = visibleCount < categories.length;
  const hasLess = visibleCount > 9 && visibleCount === categories.length;

  return (
    <div className="categories-section">
      <div className="categories-container-grid">
        <div className="categories-header">
          <span className="categories-count">
            {categories.length + 1} تصنيف
          </span>
        </div>

        <div className="categories-grid-image">
          {/* بطاقة All products */}
          <div
            className="category-card-circle"
            onClick={handleAllProductsClick}
          >
            <div className="category-icon-circle all-products-circle">
              <img
                style={{ width: "100%" }}
                src="https://syrianoor.net/uploads/article/153545950833485591.jpg"
                alt=""
              />
            </div>
            <div className="category-name-circle">جميع المنتجات</div>
          </div>

          {/* بطاقات التصنيفات */}
          {visibleCategories.map((cat, index) => (
            <div
              key={index}
              className="category-card-circle"
              onClick={(e) => handleCategoryClick(e, cat.slug)}
            >
              <div className="category-icon-circle">
                <img
                  src={getCategoryImage(cat.slug)}
                  alt={cat.slug}
                  className="category-circle-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <span className="circle-fallback" style={{ display: "none" }}>
                  {cat.slug.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="category-name-circle">{cat.slug}</div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="show-more-container">
            <button className="show-more-btn" onClick={showMoreCategories}>
              عرض كل التصنيفات
              <FaChevronDown className="show-more-icon" />
            </button>
          </div>
        )}

        {hasLess && (
          <div className="show-more-container">
            <button className="show-less-btn" onClick={showLessCategories}>
              إخفاء بعض التصنيفات
              <FaChevronUp className="show-more-icon" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
