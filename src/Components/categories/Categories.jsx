import "./styleCategories.css";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Icons
import { FaLongArrowAltRight } from "react-icons/fa";
import { FaLongArrowAltLeft } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NavBar({ onSearchSelect }) {
  const categoriesRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // حالات جديدة للتحكم في ظهور الأزرار
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorys`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // التحقق من حالة التمرير لإظهار/إخفاء الأزرار
  const checkScrollButtons = () => {
    const slider = categoriesRef.current;
    if (slider) {
      setShowLeftButton(slider.scrollLeft > 0);
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      setShowRightButton(slider.scrollLeft < maxScroll - 5);
    }
  };

  useEffect(() => {
    const slider = categoriesRef.current;
    if (slider) {
      setTimeout(checkScrollButtons, 100);
      slider.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);

      return () => {
        slider.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [categories]);

  const scrollRight = () => {
    const slider = categoriesRef.current;
    if (slider) {
      slider.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const scrollLeft = () => {
    const slider = categoriesRef.current;
    if (slider) {
      slider.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  // دالة التعامل مع الضغط على التصنيف
  const handleCategoryClick = (e, slug) => {
    e.preventDefault(); // منع السلوك الافتراضي
    navigate(`/products/${slug}`, { state: { fromLink: true } });
    if (onSearchSelect) {
      onSearchSelect(null);
    }

    // التمرير السلس إلى قسم المنتجات
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

  return (
    <div className="Box">
      <div className="continer continerNavBar">
        <div id="Home" className="Box-categories">
          <div className="categories-container">
            <div className="categories-wrapper">
              <div className="Categories" ref={categoriesRef}>
                <ul className="MainMenu">
                  <li className="MainItem">
                    <a
                      className="link"
                      href="/products"
                      onClick={handleAllProductsClick}
                      style={{ cursor: "pointer", textDecoration: "none" }}
                    >
                      جميع المنتجات
                    </a>
                  </li>
                  {categories.map((cat, index) => (
                    <li key={index} className="MainItem">
                      <a
                        className="link"
                        href={`/products/${cat.slug}`}
                        onClick={(e) => handleCategoryClick(e, cat.slug)}
                        style={{ cursor: "pointer", textDecoration: "none" }}
                      >
                        {cat.slug}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="buttons-next-prev">
              {showLeftButton && (
                <button
                  onClick={scrollLeft}
                  className="nav-button prev"
                  aria-label="التمرير لليسار"
                >
                  <FaLongArrowAltLeft />
                </button>
              )}
              {showRightButton && (
                <button
                  onClick={scrollRight}
                  className="nav-button next"
                  aria-label="التمرير لليمين"
                >
                  <FaLongArrowAltRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
