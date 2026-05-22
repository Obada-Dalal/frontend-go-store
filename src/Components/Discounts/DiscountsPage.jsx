import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaBoxOpen,
  FaDollarSign,
  FaFire,
  FaArrowLeft
} from "react-icons/fa";
import { CartContext } from "../../useContexts/CartContext.jsx";
import "./styleDiscountsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DiscountsPage() {
  const navigate = useNavigate();
  const [discountProducts, setDiscountProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

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
          const discountA = (1 - a.discountPrice / a.price) * 100;
          const discountB = (1 - b.discountPrice / b.price) * 100;
          return discountB - discountA;
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

  const calculateDiscount = (price, discountPrice) => {
    return Math.round((1 - discountPrice / price) * 100);
  };

  const renderSkeletons = () => {
    return [...Array(12)].map((_, i) => (
      <div className="box-discount-page skeleton-card" key={i}>
        <div className="skeleton-img"></div>
        <div className="skeleton-info">
          <div className="skeleton-title"></div>
          <div className="skeleton-price"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="discounts-page">
      <div className="discounts-header">
        <Link to="/" className="back-btn">
          <FaArrowLeft /> العودة للمتجر
        </Link>
        <h1>
          <FaFire className="discount-icon-large" /> جميع التخفيضات والعروض
        </h1>
        <p>استغل الفرصة واحصل على أفضل المنتجات بأسعار مخفضة</p>
      </div>

      {loading ? (
        <div className="discounts-grid">{renderSkeletons()}</div>
      ) : discountProducts.length === 0 ? (
        <div className="no-discounts">
          <FaBoxOpen />
          <h2>لا توجد تخفيضات حالياً</h2>
          <p>تفقد المتجر لاحقاً للاطلاع على أحدث العروض</p>
          <Link to="/" className="back-to-shop-btn">
            تصفح المتجر
          </Link>
        </div>
      ) : (
        <div className="discounts-grid">
          {discountProducts.map((product) => (
            <div
              key={product._id}
              className="box-discount-page"
              onClick={() => navigate(`/product/${product._id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="discount-image-container">
                <img
                  src={
                    product.images?.[0] ||
                    "https://via.placeholder.com/300x250?text=No+Image"
                  }
                  alt={product.name}
                  loading="lazy"
                />
                <div className="discount-badge-large">
                  <FaFire /> -
                  {calculateDiscount(product.price, product.discountPrice)}%
                </div>
              </div>

              <div className="discount-info">
                <h3>{product.name}</h3>
                <div className="discount-price-container">
                  <span className="new-price">
                    <FaDollarSign /> {product.discountPrice}
                  </span>
                  <span className="original-price">
                    <FaDollarSign /> {product.price}
                  </span>
                </div>
                <div className="discount-saving">
                  وفر: <FaDollarSign />{" "}
                  {(product.price - product.discountPrice).toFixed(2)}
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
                  className={
                    product.stock === 0 ? "disabled-btn" : "add-to-cart-btn"
                  }
                >
                  <FaShoppingCart />{" "}
                  {product.stock === 0 ? "نفد المخزون" : "أضف للسلة"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
