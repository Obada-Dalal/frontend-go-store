import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaShoppingCart, FaBoxOpen } from "react-icons/fa";
import "./styleLatestProducts.css";
import { FaDollarSign } from "react-icons/fa";
import { CartContext } from "../../useContexts/CartContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


export default function LatestProducts() {
  const navigate = useNavigate();
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  // جلب أحدث المنتجات
  const fetchLatestProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`);
      const sortedProducts = [...res.data].sort((a, b) => {
        const idA = a._id.toString();
        const idB = b._id.toString();
        return idB.localeCompare(idA);
      });
      const latest5 = sortedProducts.slice(0, 4);
      setLatestProducts(latest5);
    } catch (error) {
      console.error("❌ خطأ في جلب المنتجات:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء تحميل أحدث المنتجات"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestProducts();
  }, [fetchLatestProducts]);

  // ✅ Skeleton Loader
  const renderSkeletons = () => {
    return [...Array(4)].map((_, i) => (
      <div className="product-latest-card skeleton-card-latest" key={i}>
        <div className="skeleton-img-latest"></div>
        <div className="skeleton-info-latest">
          <div className="skeleton-title-latest"></div>
          <div className="skeleton-price-latest"></div>
          <div className="skeleton-stock-latest"></div>
          <div className="skeleton-btn-latest"></div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="latest-products-section">
        <div className="latest-products-header">
          <h3>أحدث المنتجات</h3>
          <p>اكتشف أحدث الإضافات إلى متجرنا</p>
          <a
            href="#Shop"
            className="chs-view-btn"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("Shop")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            عرض جميع المنتجات
          </a>
        </div>
        <div className="latest-grid">{renderSkeletons()}</div>
      </div>
    );
  }

  if (latestProducts.length === 0) {
    return (
      <div className="latest-products-section">
        <div className="no-products">
          <FaBoxOpen />
          <p>لا توجد منتجات حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-products-section">
      <div className="latest-products-header">
        <h3>أحدث المنتجات</h3>
        <p>اكتشف أحدث الإضافات إلى متجرنا</p>
        <a
          href="#Shop"
          className="chs-view-btn"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("Shop")?.scrollIntoView({
              behavior: "smooth"
            });
          }}
        >
          عرض جميع المنتجات
        </a>
      </div>

      <div className="latest-grid">
        {latestProducts.map((product) => (
          <div
            key={product._id}
            className="product-latest-card"
            onClick={() => navigate(`/product/${product._id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="latest-image">
              <img
                src={
                  product.images?.[0] ||
                  "https://via.placeholder.com/300x250?text=No+Image"
                }
                alt={product.name}
                loading="lazy"
                width="150px"
                height="212px"
              />
              <div className="product-badge">جديد</div>
            </div>

            <div className="product-info">
              <h4 className="product-name">{product.name}</h4>

              {/* ✅ تم إزالة النجوم (التقييم) */}

              <div className="product-price">
                {product.discountPrice &&
                product.discountPrice < product.price ? (
                  <>
                    <p className="current-price">
                      <FaDollarSign />
                      {product.discountPrice}
                    </p>
                    <p className="old-price">
                      <FaDollarSign />
                      {product.price}
                    </p>
                    <span className="discount-badge">
                      خصم %
                      {Math.round(
                        (1 - product.discountPrice / product.price) * 100
                      )}
                    </span>
                  </>
                ) : (
                  <p className="current-price">
                    <FaDollarSign />
                    {product.price}
                  </p>
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
  );
}
