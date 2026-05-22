import "./search.css";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { LuShoppingBag } from "react-icons/lu";
import { BiDetail } from "react-icons/bi";
import Swal from "sweetalert2";
import { useContext } from "react";
import { CartContext } from "../../useContexts/CartContext";
// ICONS
import { IoSearchSharp } from "react-icons/io5";
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FaDollarSign } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

// ثوابت
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const DEBOUNCE_DELAY = 300;

export default function Search({ keyword }) {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showBox, setShowBox] = useState(false);
  const boxRef = useRef(null);
  const [activeKeyword, setActiveKeyword] = useState(keyword);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ جلب الاقتراحات
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/products/search?q=${searchQuery}`
      );
      setSuggestions(res.data);
      setShowBox(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, []);

  // ✅ جلب نتائج البحث
  const fetchSearchResults = useCallback(async (searchKeyword) => {
    if (!searchKeyword) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/products/search?q=${searchKeyword}`
      );
      setResults(res.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء البحث"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(delayDebounce);
  }, [query, fetchSuggestions]);

  // جلب النتائج عند تغير الكلمة النشطة
  useEffect(() => {
    if (activeKeyword) {
      fetchSearchResults(activeKeyword);
    }
  }, [activeKeyword, fetchSearchResults]);

  // إغلاق الاقتراحات عند الضغط خارجها
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowBox(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ إضافة المنتج للسلة
  const handleAddToCart = useCallback(
    async (e, productId, color) => {
      e.stopPropagation();
      try {
        const added = await addToCart(productId, color, 1);
        if (added) {
          await Swal.fire({
            icon: "success",
            title: "تمت الإضافة",
            text: "تم إضافة المنتج إلى السلة بنجاح",
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        await Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "حدث خطأ أثناء إضافة المنتج إلى السلة"
        });
      }
    },
    [addToCart]
  );

  // ✅ التوجيه لصفحة التفاصيل
  const handleProductClick = useCallback(
    (productId) => {
      navigate(`/product/${productId}`);
    },
    [navigate]
  );

  const handleSearchClick = useCallback(() => {
    if (query.trim() !== "") {
      setActiveKeyword(query);
      setShowBox(false);
      setHasSearched(true);
    }
  }, [query]);

  // Skeleton Loader
  const renderSkeletons = useCallback(() => {
    return [...Array(6)].map((_, i) => (
      <div className="search-item-card search-skeleton-card" key={i}>
        <div className="search-skeleton-img"></div>
        <div className="search-item-details">
          <div className="search-skeleton-text"></div>
          <div className="search-skeleton-text search-skeleton-small"></div>
          <div className="search-skeleton-price"></div>
          <div className="search-skeleton-actions">
            <div className="search-skeleton-btn"></div>
            <div className="search-skeleton-btn"></div>
          </div>
        </div>
      </div>
    ));
  }, []);

  // عرض السعر
  const renderPrice = useCallback((product) => {
    if (product.discountPrice && product.discountPrice < product.price) {
      return (
        <>
          <p className="search-current-price">
            <FaDollarSign />
            {product.discountPrice}
          </p>
          <p className="search-old-price">
            <FaDollarSign />
            {product.price}
          </p>
        </>
      );
    }
    return (
      <p className="search-current-price">
        <FaDollarSign />
        {product.price}
      </p>
    );
  }, []);

  return (
    <div className="search-main-wrapper">
      {/* صندوق البحث */}
      <div className="search-header-section">
        <FaTimes className="search-close-icon" onClick={() => navigate(-1)} />
        <h3 className="search-header-title">🔍 البحث عن المنتجات</h3>
        <div className="search-input-wrapper" ref={boxRef}>
          <input
            type="text"
            placeholder="ابحث عن المنتجات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            className="search-field-input"
            autoFocus
          />
          <button className="search-submit-btn" onClick={handleSearchClick}>
            <IoSearchSharp />
          </button>

          {showBox && suggestions.length > 0 && (
            <div className="search-dropdown-menu">
              {suggestions.map((item) => (
                <div
                  key={item._id}
                  className="search-dropdown-item"
                  onClick={() => {
                    setActiveKeyword(item.name);
                    setShowBox(false);
                    setQuery(item.name);
                  }}
                >
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    loading="lazy"
                    className="search-dropdown-img"
                  />
                  <span className="search-dropdown-name">{item.name}</span>
                  <div className="search-dropdown-price">
                    {renderPrice(item)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* نتائج البحث */}
      <h1 className="search-results-title">
        {hasSearched ? `"${activeKeyword}" نتائج البحث عن ` : "منتجات مميزة"}
      </h1>
      <div className="search-results-container">
        <div className="search-products-grid">
          {loading ? (
            renderSkeletons()
          ) : hasSearched && results.length === 0 ? (
            <div className="search-no-results">
              <IoSearchOutline className="search-no-results-icon" />
              <h2 className="search-no-results-title">لا توجد نتائج</h2>
              <p className="search-no-results-text">
                لم نجد منتجات تطابق بحثك. جرب كلمات أخرى
              </p>
            </div>
          ) : (
            results.map((p) => (
              <div
                className="search-item-card"
                key={p._id}
                onClick={() => p.stock > 0 && handleProductClick(p._id)}
                style={{ cursor: p.stock > 0 ? "pointer" : "default" }}
              >
                <div className="search-item-image-wrapper">
                  {p.stock === 0 && (
                    <div className="search-out-of-stock-tag">
                      <span>نفد من المخزون</span>
                    </div>
                  )}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="search-item-image"
                    style={{
                      filter: p.stock === 0 ? "grayscale(80%)" : "none",
                      opacity: p.stock === 0 ? 0.7 : 1
                    }}
                  />
                </div>
                <div className="search-item-details">
                  <h3 className="search-item-name">{p.name}</h3>

                  <p
                    className={`search-item-stock ${p.stock === 0 ? "search-stock-depleted" : ""}`}
                  >
                    {p.stock === 0 ? (
                      "❌ غير متوفر"
                    ) : (
                      <>
                        متوفر: <strong>{p.stock}</strong> قطعة
                      </>
                    )}
                  </p>

                  <div className="search-item-price-wrapper">
                    {renderPrice(p)}
                  </div>

                  <div className="search-item-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(p._id);
                      }}
                      disabled={p.stock === 0}
                      className={`search-action-btn ${p.stock === 0 ? "search-btn-disabled" : ""}`}
                    >
                      <BiDetail className="search-btn-icon" />
                      تفاصيل
                    </button>

                    <button
                      onClick={(e) => handleAddToCart(e, p._id, p.color[0])}
                      disabled={p.stock === 0}
                      className={`search-action-btn ${p.stock === 0 ? "search-btn-disabled" : ""}`}
                    >
                      <LuShoppingBag className="search-btn-icon" />
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
