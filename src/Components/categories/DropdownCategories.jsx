import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./DropdownCategories.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DropdownCategories({ onSearchSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorys`);
        setCategories(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // إغلاق القائمة فقط عند الضغط على السهم (وليس عند الضغط خارجها)
  // تم تعديل هذا الجزء
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // ✅ دالة معالجة اختيار الراديو
  const handleCategorySelect = (category) => {
    setSelectedCategory(category.slug);

    // تنفيذ البحث
    if (onSearchSelect) {
      onSearchSelect(category.name);
    }

    // التنقل إلى صفحة المنتجات مع التصنيف
    if (category.slug) {
      navigate(`/products/${category.slug}`, { state: { fromLink: true } });
    }

    // ✅ القائمة تبقى مفتوحة بعد الاختيار (لا تغلق)
    // setIsOpen(false); // تم إزالة هذا السطر
  };

  // ✅ دالة اختيار جميع المنتجات
  const handleAllProductsClick = () => {
    setSelectedCategory(null);

    if (onSearchSelect) {
      onSearchSelect(null);
    }

    navigate("/products", { state: { fromLink: true } });

    // ✅ القائمة تبقى مفتوحة
    // setIsOpen(false); // تم إزالة هذا السطر
  };

  return (
    <div className="dropdown-categories-container" ref={dropdownRef}>
      <div className="dropdown-categories-wrapper">
        <button
          className={`dropdown-toggle-btn ${isOpen ? "active" : ""}`}
          onClick={toggleDropdown}
        >
          <span className="dropdown-title-text">
            التصنيفات
            {selectedCategory && (
              <span className="selected-category-name">
                : {selectedCategory}
              </span>
            )}
          </span>
          {isOpen ? (
            <FaChevronUp className="dropdown-arrow-icon" />
          ) : (
            <FaChevronDown className="dropdown-arrow-icon" />
          )}
        </button>

        <div className={`dropdown-menu-list ${isOpen ? "open" : ""}`}>
          <ul className="dropdown-items-list">
            {/* ✅ خيار جميع المنتجات مع راديو */}
            <li className="dropdown-list-item">
              <label
                className={`category-radio-label ${!selectedCategory ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategory}
                  onChange={handleAllProductsClick}
                  className="category-radio"
                />
                <span className="radio-custom">
                  {!selectedCategory && <span className="radio-dot"></span>}
                </span>
                <span className="category-name-text">جميع المنتجات</span>
              </label>
            </li>

            {loading ? (
              <li className="dropdown-list-item loading-item">
                <span>جاري التحميل...</span>
              </li>
            ) : (
              categories.map((cat, index) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <li key={index} className="dropdown-list-item">
                    <label
                      className={`category-radio-label ${isSelected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.slug}
                        checked={isSelected}
                        onChange={() => handleCategorySelect(cat)}
                        className="category-radio"
                      />
                      <span className="radio-custom">
                        {isSelected && <span className="radio-dot"></span>}
                      </span>
                      <span className="category-name-text">{cat.slug}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
