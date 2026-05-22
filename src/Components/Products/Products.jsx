import "./Products.css";
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useContext, useRef } from "react";
import axios from "axios";
import { CartContext } from "../../useContexts/CartContext.jsx";
import Search from "../Search/Search.jsx";
import { useOutletContext } from "react-router-dom";
import Swal from "sweetalert2";
import Categories from "../categories/Categories.jsx";
import { useNavigate } from "react-router-dom";

// ICONS
import { MdOutlineLocalGroceryStore } from "react-icons/md";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { LuShoppingBag } from "react-icons/lu";
import { BiDetail } from "react-icons/bi";
import { FaDollarSign } from "react-icons/fa";

// ثوابت
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const { searchKeyword } = useOutletContext();
  const navigate = useNavigate();

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // عدد المنتجات في الصفحة
  const [productsPerPage, setProductsPerPage] = useState(16);

  // Reference للـ Grid container
  const gridRef = useRef(null);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // حساب عدد الأعمدة الفعلي من CSS
  const getColumnsCount = useCallback(() => {
    if (!gridRef.current) return 4;

    const gridComputedStyle = window.getComputedStyle(gridRef.current);
    const gridTemplateColumns = gridComputedStyle.getPropertyValue(
      "grid-template-columns"
    );

    const columns = gridTemplateColumns.split(" ").length;
    return columns || 4;
  }, []);

  // تحديث productsPerPage بناءً على عدد الأعمدة الفعلي
  const updateProductsPerPage = useCallback(() => {
    const columns = getColumnsCount();
    let newProductsPerPage;

    const width = window.innerWidth;

    if (width >= 1200) {
      newProductsPerPage = columns * 4;
    } else if (width >= 992) {
      newProductsPerPage = columns * 5;
    } else if (width >= 768) {
      newProductsPerPage = columns * 4;
    } else if (width >= 576) {
      newProductsPerPage = columns * 5;
    } else if (width >= 480) {
      newProductsPerPage = columns * 4;
    } else {
      newProductsPerPage = columns * 6;
    }

    setProductsPerPage(newProductsPerPage);
  }, [getColumnsCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateProductsPerPage();
    }, 100);

    return () => clearTimeout(timer);
  }, [updateProductsPerPage, products.length]);

  useEffect(() => {
    const handleResize = () => {
      updateProductsPerPage();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateProductsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productsPerPage]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const productsSection =
      document.getElementById("products-section") ||
      document.getElementById("all-products");
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [currentPage]);

  const { slug } = useParams();
  // eslint-disable-next-line no-unused-vars
  const location = useLocation();

  // جلب المنتجات
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/products`;
        if (slug) {
          url = `${API_BASE_URL}/api/products/category/${slug}`;
        }
        const res = await axios.get(url);
        setProducts(res.data);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  // عرض النجوم
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

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = [...products]
    .reverse()
    .slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // دالة عرض أرقام الصفحات
  const getPageNumbers = () => {
    const pages = new Set();

    pages.add(1);
    pages.add(currentPage);
    if (currentPage - 1 >= 2) pages.add(currentPage - 1);
    if (currentPage + 1 <= totalPages) pages.add(currentPage + 1);
    if (currentPage + 2 <= totalPages) pages.add(currentPage + 2);
    pages.add(totalPages);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        if (sorted[i] === totalPages) {
          result.push("...");
        }
      }
      result.push(sorted[i]);
    }
    return result;
  };

  // Skeleton Loader
  const renderSkeletons = () => {
    return [...Array(productsPerPage)].map((_, i) => (
      <div className="box-products skeleton-card" key={i}>
        <div className="skeleton-img"></div>
        <div className="info">
          <div className="skeleton-text"></div>
          <div className="skeleton-text small"></div>
          <div className="skeleton-price"></div>
          <div className="skeleton-buttons">
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="BoxProducts-search">
      {searchKeyword ? (
        <Search keyword={searchKeyword} />
      ) : (
        <>
          <h1 id="Shop" className="name-section">
            جميع المنتجات
          </h1>
          <Categories />

          <div id="all-products" className="container-products">
            <div
              id="products-section"
              className="perant-products"
              ref={gridRef}
            >
              {loading && renderSkeletons()}

              {!loading &&
                currentProducts.map((p) => (
                  <div
                    className="box-products"
                    key={p._id}
                    data-aos="fade-right"
                    onClick={() => navigate(`/product/${p._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        position: "relative"
                      }}
                    >
                      {p.stock === 0 && (
                        <div className="out-of-stock-badge">
                          <span>نفد من المخزون</span>
                        </div>
                      )}
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        width="150px"
                        height="212px"
                        loading="lazy"
                        style={{
                          filter: p.stock === 0 ? "grayscale(80%)" : "none",
                          opacity: p.stock === 0 ? 0.7 : 1
                        }}
                      />
                    </div>

                    <div className="info">
                      <h3>{p.name}</h3>
                      <div className="stars">{renderStars(p.rating)}</div>

                      <p
                        className={`stock ${p.stock === 0 ? "out-of-stock" : ""}`}
                      >
                        {p.stock === 0 ? (
                          <span
                            style={{ color: "#dc2626", fontWeight: "bold" }}
                          >
                            غير متوفر
                          </span>
                        ) : (
                          <>
                            <span className="stock-poducts">
                              متوفر (<span>{p.stock}</span> قطعة)
                            </span>
                          </>
                        )}
                      </p>

                      <div className="price">
                        {p.discountPrice && p.discountPrice < p.price ? (
                          <>
                            <span className="discount-badge">
                              خصم %
                              {Math.round(
                                (1 - p.discountPrice / p.price) * 100
                              )}
                            </span>
                            <span className="price-item current-price-products">
                              <FaDollarSign className="price-icon current-icon" />
                              {p.discountPrice}
                            </span>
                            <span className="price-item old-price">
                              <FaDollarSign className="price-icon old-icon" />
                              <span className="strikethrough">{p.price}</span>
                            </span>
                          </>
                        ) : (
                          <span className="price-item current-price-products">
                            <FaDollarSign className="price-icon current-icon" />
                            {p.price}
                          </span>
                        )}
                      </div>

                      <div className="button-details-addtocart">
                        <button
                          onClick={() => navigate(`/product/${p._id}`)}
                          disabled={p.stock === 0}
                          className={p.stock === 0 ? "disabled-button" : ""}
                        >
                          التفاصيل
                          <BiDetail className="icon-store" />
                        </button>

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (p.stock === 0) return;
                            const added = await addToCart(
                              p._id,
                              p.color?.[0] || ""
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
                          disabled={p.stock === 0}
                          className={p.stock === 0 ? "disabled-button" : ""}
                        >
                          اضافة
                          <LuShoppingBag className="icon-store" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="pagination-container">
                {totalPages === 1 ? (
                  <div className="single-page-indicator">
                    <span className="single-page-text">
                      📄 الصفحة {currentPage} من {totalPages}
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      className="pagination-btn prev"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      ◀ السابق
                    </button>
                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`dots-${idx}`} className="pagination-dots">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page} // ✅ مفتاح فريد لكل صفحة
                          className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                          onClick={() => paginate(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className="pagination-btn next"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                    >
                      التالي ▶
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Products;
