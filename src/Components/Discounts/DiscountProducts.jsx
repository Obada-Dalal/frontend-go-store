import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaShoppingCart,
  FaBoxOpen,
  FaDollarSign,
  FaFire,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { CartContext } from "../../useContexts/CartContext.jsx";
import "./styleDiscountProducts.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DiscountProducts() {
  const navigate = useNavigate();
  const [discountProducts, setDiscountProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // حساب عدد المنتجات المعروضة حسب حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200)
        setVisibleCount(6); // 6
      else if (width >= 992)
        setVisibleCount(5); // 5
      else if (width >= 768)
        setVisibleCount(4); // كما هي
      else if (width >= 576)
        setVisibleCount(3); // كان 2 → أصبح 3
      else setVisibleCount(1); // موبايل صغير: منتج واحد
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // جلب المنتجات المخفضة
  const fetchDiscountProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`);
      const discounted = res.data
        .filter(
          (product) =>
            product.discountPrice && product.discountPrice < product.price
        )
        .sort((a, b) => {
          const idA = a._id.toString();
          const idB = b._id.toString();
          return idB.localeCompare(idA);
        });
      setDiscountProducts(discounted);
    } catch (error) {
      console.error("❌ خطأ في جلب المنتجات المخفضة:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء تحميل المنتجات المخفضة"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscountProducts();
  }, [fetchDiscountProducts]);

  // التحريك التلقائي - يحرك منتج منتج
  useEffect(() => {
    if (discountProducts.length === 0 || isPaused) return;

    autoPlayRef.current = setInterval(() => {
      if (!isTransitioning) {
        setCurrentIndex((prev) => {
          // إذا وصلنا لآخر منتج مرئي، نعود للبداية
          if (prev >= discountProducts.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }
    }, 4000); // سرعة الانتقال: 800ms بين كل منتج والثاني

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [discountProducts.length, isPaused, isTransitioning]);

  // التنقل يدوياً - يحرك منتج منتج
  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    setCurrentIndex((prev) => {
      // إذا كان آخر منتج + المنتجات المرئية سيظهرون خارج المصفوفة
      const maxStartIndex = Math.max(0, discountProducts.length - visibleCount);
      if (prev >= maxStartIndex) {
        return 0;
      }
      return prev + 1;
    });

    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    setCurrentIndex((prev) => {
      const maxStartIndex = Math.max(0, discountProducts.length - visibleCount);
      if (prev <= 0) {
        return maxStartIndex;
      }
      return prev - 1;
    });

    setTimeout(() => setIsTransitioning(false), 500);
  };

  // حساب نسبة الخصم
  const calculateDiscount = (price, discountPrice) => {
    return Math.round((1 - discountPrice / price) * 100);
  };

  // استخراج المنتجات المعروضة حالياً
  const getVisibleProducts = () => {
    const products = [...discountProducts];
    const visible = [];

    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % products.length;
      visible.push(products[index]);
    }

    return visible;
  };

  // حساب عدد النقاط (كل نقطة = مجموعة من المنتجات)
  const totalDots = Math.max(1, discountProducts.length - visibleCount + 1);
  // const activeDot = Math.floor(currentIndex / Math.max(1, visibleCount));

  // Skeleton Loader
  const renderSkeletons = () => {
    return [...Array(visibleCount)].map((_, i) => (
      <div className="product-discount-card skeleton-card-discount" key={i}>
        <div className="skeleton-img-discount"></div>
        <div className="skeleton-info-discount">
          <div className="skeleton-title-discount"></div>
          <div className="skeleton-price-discount"></div>
          <div className="skeleton-stock-discount"></div>
          <div className="skeleton-btn-discount"></div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="discount-products-section">
        <div className="discount-products-header">
          <h3>
            <FaFire className="discount-icon" /> العروض والتخفيضات
          </h3>
          <p>اغتنم الفرصة واحصل على أفضل العروض</p>
          <Link to="/discounts" className="chs-view-btn discount-btn">
            عرض جميع التخفيضات
          </Link>
        </div>
        <div className="discount-slider-container">
          <div className="discount-grid">{renderSkeletons()}</div>
        </div>
      </div>
    );
  }

  if (discountProducts.length === 0) {
    return (
      <div className="discount-products-section">
        <div className="discount-products-header">
          <h3>
            <FaFire className="discount-icon" /> العروض والتخفيضات
          </h3>
          <p>اغتنم الفرصة واحصل على أفضل العروض</p>
        </div>
        <div className="no-products discount-empty">
          <FaBoxOpen />
          <p>لا توجد تخفيضات حالياً</p>
        </div>
      </div>
    );
  }

  const visibleProducts = getVisibleProducts();

  return (
    <div className="discount-products-section">
      <div className="discount-products-header">
        <h3>
          <FaFire className="discount-icon" /> العروض والتخفيضات
        </h3>
        <p>اغتنم الفرصة واحصل على أفضل العروض</p>
        <Link to="/discounts" className="chs-view-btn discount-btn">
          عرض جميع التخفيضات
        </Link>
      </div>

      <div
        className="discount-slider-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="discount-grid-wrapper">
          <div className="discount-grid">
            {visibleProducts.map((product, index) => (
              <div
                key={`${product._id}-${index}`}
                className="product-discount-card"
                onClick={() => navigate(`/product/${product._id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="discount-image">
                  <img
                    src={
                      product.images?.[0] ||
                      "https://via.placeholder.com/300x250?text=No+Image"
                    }
                    alt={product.name}
                    loading="lazy"
                  />
                  <div className="discount-badge-special">
                    <FaFire /> خصم %
                    {calculateDiscount(product.price, product.discountPrice)}
                  </div>
                </div>

                <div className="product-info">
                  <h4 className="product-name">{product.name}</h4>

                  <div className="product-price-discount">
                    <p className="current-price discount-price-highlight">
                      <FaDollarSign />
                      {product.discountPrice}
                    </p>
                    <p className="old-price">
                      <FaDollarSign />
                      {product.price}
                    </p>
                  </div>

                  <div className="discount-details">
                    <div
                      className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock-latest"}`}
                    >
                      {product.stock > 0 ? `متوفر` : "غير متوفر"}
                    </div>
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
                      className={`${product.stock === 0 ? "latest-disabled-button" : "btn-cart-discount discount-cart-btn"}`}
                    >
                      <FaShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أزرار التنقل */}
        <button className="slider-arrow slider-arrow-left" onClick={prevSlide}>
          <FaChevronLeft />
        </button>
        <button className="slider-arrow slider-arrow-right" onClick={nextSlide}>
          <FaChevronRight />
        </button>

        {/* نقاط المؤشر */}
        <div className="slider-dots">
          {[...Array(totalDots)].map((_, index) => (
            <span
              key={index}
              className={`dot ${Math.floor(currentIndex) === index ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
