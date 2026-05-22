import "./ProductDetails.css";
import { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../../useContexts/CartContext.jsx";
import Swal from "sweetalert2";
import {
  FaStar,
  FaStarHalfAlt,
  FaShareAlt,
  FaWhatsapp,
  FaShoppingCart
} from "react-icons/fa";
import { MdOutlineLocalGroceryStore } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa6";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import Footer from "../Footer/Footer.jsx"; // ✅ إضافة استيراد الفوتر

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WHATSAPP_NUMBER = "+963982359538";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [localStock, setLocalStock] = useState(0);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("description");

  // ✅ دالة لجلب منتجات مقترحة بطريقة ذكية
  const fetchSuggestedProducts = useCallback(async (currentProduct) => {
    try {
      // جلب جميع المنتجات
      const res = await axios.get(`${API_BASE_URL}/api/products`);
      let allProducts = res.data;

      // استبعاد المنتج الحالي
      allProducts = allProducts.filter((p) => p._id !== currentProduct._id);

      if (allProducts.length === 0) return [];

      // ✅ خوارزمية التشابه (Similarity Algorithm)
      const scoredProducts = allProducts.map((p) => {
        let score = 0;

        // 1. نفس التصنيف (وزن 40%)
        if (
          p.categoryId === currentProduct.categoryId ||
          p.categoryId?._id === currentProduct.categoryId?._id ||
          p.categoryId === currentProduct.categoryId?._id
        ) {
          score += 40;
        }

        // 2. نفس العلامة التجارية (وزن 30%)
        if (
          p.brand &&
          currentProduct.brand &&
          p.brand.toLowerCase() === currentProduct.brand.toLowerCase()
        ) {
          score += 30;
        }

        // 3. سعر قريب (وزن 20%) - فرق أقل من 30%
        const currentPrice =
          currentProduct.discountPrice || currentProduct.price;
        const productPrice = p.discountPrice || p.price;
        const priceDiff = Math.abs(
          (productPrice - currentPrice) / currentPrice
        );
        if (priceDiff < 0.3) {
          score += 20 * (1 - priceDiff);
        }

        // 4. نفس اللون أو ألوان متشابهة (وزن 10%)
        if (
          currentProduct.color &&
          p.color &&
          currentProduct.color.length > 0 &&
          p.color.length > 0
        ) {
          const hasCommonColor = currentProduct.color.some((c) =>
            p.color.some((pc) => pc.toLowerCase() === c.toLowerCase())
          );
          if (hasCommonColor) score += 10;
        }

        return { ...p, score };
      });

      // ترتيب حسب الأعلى درجة وأخذ 4 منتجات
      const sorted = scoredProducts.sort((a, b) => b.score - a.score);
      return sorted.slice(0, 4);
    } catch (error) {
      console.error("Error fetching suggested products:", error);
      return [];
    }
  }, []);

  // جلب تفاصيل المنتج
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
      const productData = res.data;
      setProduct(productData);
      setMainImage(productData.images?.[0] || "");
      setLocalStock(productData.stock);
      if (productData.color && productData.color.length > 0) {
        setSelectedColor(productData.color[0]);
      }

      // ✅ جلب منتجات مقترحة باستخدام الخوارزمية الذكية
      const suggested = await fetchSuggestedProducts(productData);
      setSuggestedProducts(suggested);
    } catch (error) {
      console.error("Error fetching product:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء تحميل المنتج"
      });
    } finally {
      setLoading(false);
    }
  }, [id, fetchSuggestedProducts]);
  // console.log(product);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [fetchProduct]);

  // دوال الكمية
  const increaseQuantity = () => {
    if (quantity < localStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // إضافة إلى السلة
  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "تسجيل الدخول مطلوب",
        text: "يجب تسجيل الدخول لإضافة المنتج إلى السلة",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#3085d6"
      }).then(() => navigate("/login"));
      return;
    }

    if (!selectedColor && product?.color?.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى اختيار لون قبل إضافة المنتج إلى السلة"
      });
      return;
    }

    const added = await addToCart(product._id, selectedColor || "", quantity);
    if (added) {
      Swal.fire({
        icon: "success",
        title: "تمت الإضافة",
        text: "تم إضافة المنتج إلى السلة بنجاح",
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // الشراء عبر واتساب
  const handleBuyWhatsApp = () => {
    if (!selectedColor && product?.color?.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى اختيار لون قبل الشراء"
      });
      return;
    }

    // إظهار رسالة تأكيد قبل فتح واتساب
    Swal.fire({
      title: "جاهز للشراء عبر واتساب؟",
      text: "سيتم فتح محادثة واتساب لإتمام عملية الشراء",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، افتح واتساب",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#25D366",
      cancelButtonColor: "#d33",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // المستخدم وافق، الآن نفتح الواتساب
        const price =
          product.discountPrice && product.discountPrice < product.price
            ? product.discountPrice
            : product.price;

        const message =
          `مرحباً، أرغب بشراء المنتج التالي:\n\n` +
          `📦 الاسم: ${product.name}\n` +
          `💰 السعر: ${price}$\n` +
          `🎨 اللون: ${selectedColor || "لم يتم الاختيار"}\n` +
          `🔢 الكمية: ${quantity}\n\n` +
          `يرجى تأكيد الطلب.`;

        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    });
  };

  // مشاركة المنتج
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    Swal.fire({
      icon: "success",
      title: "تم النسخ",
      text: "تم نسخ رابط المنتج إلى الحافظة",
      timer: 1500,
      showConfirmButton: false
    });
  };

  // عرض التقييم
  const renderStars = (rating) => {
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
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="loading-skeleton-product">
          <div className="skeleton-product-image"></div>
          <div className="skeleton-product-info">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <div className="not-found">
          <h2>المنتج غير موجود</h2>
          <button onClick={() => navigate("/")}>العودة إلى الرئيسية</button>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line no-unused-vars
  const price =
    product.discountPrice && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;

  return (
    <>
      <div className="product-details-page">
        <div className="product-details-container">
          {/* قسم الصور */}
          <div className="product-gallery">
            <div className="main-image">
              <img src={mainImage} alt={product.name} />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail ${mainImage === img ? "active" : ""}`}
                    onClick={() => setMainImage(img)}
                  >
                    <img src={img} alt={`${product.name} - ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* قسم المعلومات */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            <h2 className="product-brand">{product.brand}</h2>

            <div className="product-rating">
              {renderStars(product.rating || 0)}
              {/* <span className="rating-count">
                ({product.reviewCount || 0} تقييم)
              </span> */}
            </div>

            <div className="product-price-wrapper">
              {hasDiscount ? (
                <>
                  <span className="current-price-product-details">
                    <FaDollarSign /> {product.discountPrice}
                  </span>
                  <span className="old-price">
                    <FaDollarSign /> {product.price}
                  </span>
                  <span className="discount-badge-product-details">
                    -{discountPercent}%
                  </span>
                </>
              ) : (
                <span className="current-price-product-details">
                  <FaDollarSign /> {product.price}
                </span>
              )}
            </div>

            <div className="product-stock-info">
              {product.stock > 0 ? (
                <span className="in-stock">
                  ✅ متوفر ({product.stock} قطعة)
                </span>
              ) : (
                <span className="out-of-stock">❌ غير متوفر</span>
              )}
            </div>

            {/* الألوان */}
            {product.color && product.color.length > 0 && (
              <div className="product-colors">
                <div className="color-options">
                  {product.color.map((color, idx) => (
                    <button
                      key={idx}
                      className={`color-btn ${selectedColor === color ? "active" : ""}`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <label>: اللون</label>
              </div>
            )}

            {/* الكمية */}
            {product.stock > 0 && (
              <div className="product-quantity">
                <div className="quantity-controls">
                  <button onClick={decreaseQuantity} disabled={quantity <= 1}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <label>: الكمية</label>
              </div>
            )}

            {/* الأزرار */}
            <div className="product-actions">
              {product.stock > 0 ? (
                <>
                  <button className="btn-add-to-cart" onClick={handleAddToCart}>
                    <MdOutlineLocalGroceryStore /> أضف إلى السلة
                  </button>
                  <button
                    className="btn-buy-whatsapp"
                    onClick={handleBuyWhatsApp}
                  >
                    <FaWhatsapp /> شراء عبر واتساب
                  </button>
                </>
              ) : (
                <button className="btn-out-of-stock" disabled>
                  غير متوفر حالياً
                </button>
              )}
            </div>

            {/* زر المشاركة */}
            <button className="btn-share" onClick={handleShare}>
              <FaShareAlt /> مشاركة المنتج
            </button>
          </div>
        </div>

        {/* تبويبات الوصف والميزات */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button
              className={`tab-btn det ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              وصف المنتج
            </button>
            {/* <button
              className={`tab-btn det ${activeTab === "specs" ? "active" : ""}`}
              onClick={() => setActiveTab("specs")}
            >
              المواصفات
            </button> */}
          </div>
          <div className="tabs-content">
            {activeTab === "description" && (
              <p className="product-description">{product.description}</p>
            )}
            {activeTab === "specs" && (
              <div className="product-specs">
                <ul>
                  <li>
                    <span>العلامة التجارية:</span> {product.brand || "غير محدد"}
                  </li>
                  <li>
                    <span>التصنيف:</span>{" "}
                    {product.categoryId?.type || "غير مصنف"}
                  </li>
                  <li>
                    <span>رمز المنتج:</span> {product._id}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ✅ منتجات مقترحة - خوارزمية تشابه ذكية */}
        {suggestedProducts.length > 0 && (
          <div className="suggested-products">
            <h3>قد يعجبك أيضاً</h3>
            <div className="suggested-grid">
              {suggestedProducts.map((item) => (
                <div
                  key={item._id}
                  className="suggested-card"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <img src={item.images?.[0]} alt={item.name} />
                  <h4>{item.name}</h4>
                  <div className="icon-card-price">
                    <p className="suggested-price">
                      <FaDollarSign /> {item.discountPrice || item.price}
                    </p>
                    <div className="product-latest-actions">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (item.stock === 0) return;
                          const added = await addToCart(
                            item._id,
                            item.color?.[0] || ""
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
                        disabled={item.stock === 0}
                        className={`${item.stock === 0 ? "latest-disabled-button" : "btn-cart"}`}
                      >
                        <FaShoppingCart />
                      </button>
                    </div>
                  </div>
                  {/* ✅ إظهار نسبة التشابه (اختياري - للمستخدم) */}
                  {/* {item.score > 50 && (
                    <span className="similarity-badge">متشابه بنسبة عالية</span>
                  )} */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ إضافة الـ Footer في النهاية */}
      <Footer />
    </>
  );
}
