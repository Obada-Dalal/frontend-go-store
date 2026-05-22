/* eslint-disable no-unused-vars */
import "./styleChargerProductsSlider.css";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useContext
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaDollarSign,
  FaStar,
  FaStarHalfAlt
} from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { CartContext } from "../../useContexts/CartContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChargerProductsSlider() {
  const navigate = useNavigate(); // ✅ إضافة useNavigate
  const [allProducts, setAllProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);
  const { addToCart } = useContext(CartContext);

  const PRODUCTS_PER_SLIDE = 4;

  // ✅ تم إزالة حالات الـ Modal (selectedProduct, mainImage, selectedColor)

  // ✅ تم إزالة fetchProductById (سنستخدم navigate بدلاً منها)

  // ✅ تم إزالة increaseSelected و decreaseSelected

  // دالة عرض التقييم
  const renderStars = useCallback((rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className="star active" />);
      } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
        stars.push(<FaStarHalfAlt key={i} className="star active" />);
      } else {
        stars.push(<FaStar key={i} className="star" />);
      }
    }
    return stars;
  }, []);

  // ✅ تم إزالة closeModal

  const fetchChargerProducts = useCallback(async () => {
    setLoading(true);
    try {
      const categoriesRes = await axios.get(`${API_BASE_URL}/api/categorys`);
      const categories = categoriesRes.data;

      const chargerCategory = categories.find(
        (cat) =>
          cat.name === "Charger & Cable" ||
          cat.slug === "Charger & Cable" ||
          cat.name?.toLowerCase().includes("charger") ||
          cat.slug?.toLowerCase().includes("charger")
      );

      if (!chargerCategory) {
        console.log("لم يتم العثور على تصنيف شواحن");
        setAllProducts([]);
        setLoading(false);
        return;
      }

      const productsRes = await axios.get(`${API_BASE_URL}/api/products`);
      const allProductsData = productsRes.data;

      const chargerProducts = allProductsData.filter((product) => {
        if (product.categoryId === chargerCategory._id) return true;
        if (product.categoryId && typeof product.categoryId === "object") {
          if (product.categoryId._id === chargerCategory._id) return true;
          if (product.categoryId.name === chargerCategory.name) return true;
          if (product.categoryId.slug === chargerCategory.slug) return true;
        }
        if (String(product.categoryId) === String(chargerCategory._id))
          return true;
        return false;
      });

      setAllProducts(chargerProducts);
    } catch (error) {
      console.error("خطأ في جلب منتجات الشواحن:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء تحميل منتجات الشواحن"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const groupProducts = useCallback((products) => {
    const groups = [];
    for (let i = 0; i < products.length; i += PRODUCTS_PER_SLIDE) {
      groups.push(products.slice(i, i + PRODUCTS_PER_SLIDE));
    }
    return groups;
  }, []);

  useEffect(() => {
    fetchChargerProducts();
  }, [fetchChargerProducts]);

  useEffect(() => {
    if (allProducts.length > 0) {
      const groups = groupProducts(allProducts);
      setProductGroups(groups);
      setCurrentIndex(0);
    }
  }, [allProducts, groupProducts]);

  useEffect(() => {
    if (productGroups.length === 0 || isPaused) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === productGroups.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [productGroups, isPaused]);

  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? productGroups.length - 1 : prev - 1
    );
    handleInteraction();
  }, [productGroups.length, handleInteraction]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === productGroups.length - 1 ? 0 : prev + 1
    );
    handleInteraction();
  }, [productGroups.length, handleInteraction]);

  const renderSkeleton = useMemo(
    () => (
      <div className="chs-wrapper">
        <div className="chs-slider-area">
          <div className="chs-skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="chs-skeleton-card">
                <div className="chs-skeleton-img"></div>
                <div className="chs-skeleton-info">
                  <div className="chs-skeleton-title"></div>
                  <div className="chs-skeleton-price"></div>
                  <div className="chs-skeleton-btn"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    []
  );

  if (loading) return renderSkeleton;

  if (allProducts.length === 0) {
    return (
      <div className="chs-wrapper">
        <div className="chs-slider-area">
          <div className="chs-empty-message">
            <h3>📦 لا توجد منتجات</h3>
            <p>لا توجد منتجات في قسم الشواحن حالياً</p>
            <p className="chs-hint">
              نصيحة: تأكد من ربط المنتجات بتصنيف "Charger & Cable" في لوحة
              التحكم
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chs-wrapper">
      <div className="chs-slider-area">
        <div className="chs-header">
          {/* 🔌 */}
          <h2> شواحن سريعة</h2>
          <p>أحدث الشواحن المتوفرة في متجرنا</p>
          {/* <Link to="/products/Charger & Cable" className="chs-view-btn">
            عرض جميع الشواحن
          </Link> */}
        </div>

        {productGroups.length > 1 && (
          <>
            <button
              className="chs-nav-btn chs-nav-prev"
              onClick={goToPrevious}
              aria-label="السابق"
            >
              ❮
            </button>
            <button
              className="chs-nav-btn chs-nav-next"
              onClick={goToNext}
              aria-label="التالي"
            >
              ❯
            </button>
          </>
        )}

        <div
          className="chs-slider-track"
          ref={sliderRef}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {productGroups.map((group, groupIndex) => (
            <div
              className="chs-slide"
              key={groupIndex}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="chs-products-grid">
                {group.map((product) => (
                  <div
                    key={product._id}
                    className="chs-product-card"
                    onClick={() => navigate(`/product/${product._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="chs-product-img">
                      <img
                        style={{ width: "150px", height: "212px" }}
                        src={
                          product.images?.[0] ||
                          "https://via.placeholder.com/300x250?text=No+Image"
                        }
                        alt={product.name}
                        loading="lazy"
                      />

                      {/* التحقق من وجود خصم حقيقي */}
                      {product.discountPrice > 0 &&
                        product.discountPrice < product.price && (
                          <span className="chs-discount-badge">
                            {Math.round(
                              (1 - product.discountPrice / product.price) * 100
                            )}
                            %
                          </span>
                        )}

                      {product.stock === 0 && (
                        <span className="chs-outstock-badge">
                          نفذ من المخزون
                        </span>
                      )}
                    </div>

                    <div className="chs-product-info">
                      <h4 className="chs-product-name">{product.name}</h4>

                      <div className="chs-price-wrapper">
                        {product.discountPrice &&
                        product.discountPrice < product.price ? (
                          <>
                            <span className="chs-current-price">
                              <FaDollarSign /> {product.discountPrice}
                            </span>
                            <span className="chs-old-price">
                              <FaDollarSign /> {product.price}
                            </span>
                          </>
                        ) : (
                          <span className="chs-current-price">
                            <FaDollarSign /> {product.price}
                          </span>
                        )}
                      </div>

                      <div className="latest-detales">
                        <div
                          className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock-latest"}`}
                        >
                          {product.stock > 0 ? `متوفر` : "غير متوفر"}
                        </div>
                        <div className="product-latest-actions">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (product.stock === 0) return;
                              const added = await addToCart(
                                product._id,
                                product.color?.[0] || ""
                              );
                              if (added) {
                                await Swal.fire({
                                  icon: "success",
                                  title: "تمت الإضافة",
                                  text: "تم إضافة المنتج إلى السلة بنجاح",
                                  timer: 1500,
                                  showConfirmButton: false
                                });
                              }
                            }}
                            disabled={product.stock === 0}
                            className={`${product.stock === 0 ? "latest-disabled-button" : "btn-cart"}`}
                          >
                            <FaShoppingCart />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
