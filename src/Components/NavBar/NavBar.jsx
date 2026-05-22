import "./NavBar.css";
import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../../useContexts/CartContext.jsx";
import { UserContext } from "../../useContexts/UserContext";
import Swal from "sweetalert2";

// Icons
import { MdLogout } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { IoReorderThree } from "react-icons/io5";
import { GrClose } from "react-icons/gr";
import { FaBox } from "react-icons/fa";
import { OrderContext } from "../../useContexts/OrderContext.jsx";

export default function NavBar() {
  const { cartCount, refreshCart } = useContext(CartContext);
  const { orderCount, refreshOrders } = useContext(OrderContext);
  const [showtags, setshowtags] = useState(false);
  const [animation, setAnimation] = useState("");
  const { user, isAdmin, logoutUser } = useContext(UserContext);
  const navigate = useNavigate();

  // دالة تسجيل الخروج مع رسالة تأكيد
  const handleLogout = () => {
    Swal.fire({
      title: "تسجيل الخروج",
      text: "هل أنت متأكد من تسجيل الخروج؟",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    }).then((result) => {
      if (result.isConfirmed) {
        logoutUser();
        refreshCart();
        refreshOrders();
        navigate("/login");
      }
    });
  };

  const handeltags = () => {
    setshowtags(true);
    setAnimation("show");
  };

  function closeTags() {
    setAnimation("hide");
  }
  return (
    <div>
      <div className="continerNavBar">
        <div id="Home" className="BoxNavBar">
          <div className="LogoAndSearchAndSignInAndShoppingcart">
            <div className="Logo">
              <img src="Images/SVGLogo.svg" alt="Logo" />
            </div>
            {isAdmin && (
              <Link to="/Dashboard" className="dashboard-btn media">
                Dashboard
              </Link>
            )}
            <div className="Bergar">
              <IoReorderThree
                onClick={handeltags}
                title="افتح القائمة الرئيسية"
              />
            </div>

            <div className="main-nav">
              <ul>
                <li>
                  <a href="#Home">الرئيسية</a>
                </li>
                <li>
                  <a href="#Shop"> تسوق الأن</a>
                </li>
                <li>
                  <a href="#services">الخدمات</a>
                </li>
                <li>
                  <a href="#Contact Us">تواصل معنا</a>
                </li>
                {/* <li>
                  <a href="#footer">Help</a>
                </li> */}

                {isAdmin && (
                  <Link to="/Dashboard" className="dashboard-btn">
                    Dashboard
                  </Link>
                )}
              </ul>
            </div>

            <div className="SignInAndShoppingcart">
              <Link to="/search">
                <IoSearchSharp className="search-icon" />
              </Link>

              <Link to="/cart" className="cart-icon">
                <button className="cart">
                  <FaShoppingCart />
                </button>
                <span className="cart-badge">{cartCount}</span>
              </Link>
              <Link to="/my-orders" className="order-icon">
                <FaBox />
                <span className="order-badge">{orderCount}</span>
              </Link>

              {user ? (
                <button
                  className="logout"
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                >
                  <MdLogout />
                </button>
              ) : (
                <Link to="/login">
                  <button className="login">تسجيل الدخول</button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showtags && (
        <div
          className={`tagsTow ${
            animation === "show" ? "animateShow" : "animateHide"
          }`}
          onAnimationEnd={() => {
            if (animation === "hide") setshowtags(false);
          }}
        >
          <div className="divClosTags">
            <GrClose
              className="Closeicon"
              onClick={closeTags}
              title="إغلاق القائمة"
            />
          </div>

          <div className="SignInAndShoppingcartTowTag">
            <div className="ULTagTow">
              <ul>
                <li>
                  <Link to="/search">
                    <IoSearchSharp className="search-icon" />
                  </Link>
                </li>
                <li>
                  <a onClick={closeTags} href="#Home">
                    الرئيسية
                  </a>
                </li>
                <li>
                  <a onClick={closeTags} href="#Shop">
                    تسوق الأن
                  </a>
                </li>
                <li>
                  <a onClick={closeTags} href="#services">
                    الخدمات
                  </a>
                </li>
                <li>
                  <a onClick={closeTags} href="#Contact Us">
                    تواصل معنا
                  </a>
                </li>
                {/* <li>
                  <a onClick={closeTags} href="#footer">
                    Help
                  </a>
                </li> */}
              </ul>
            </div>

            <Link to="/cart" className="cart-iconTow" onClick={closeTags}>
              <button className="cart">
                <FaShoppingCart />
              </button>
              <span className="cart-badgeTowTag">{cartCount}</span>
            </Link>

            <Link to="/my-orders" className="order-icon-tow">
              <FaBox />
              <span className="order-badge">{orderCount}</span>
            </Link>
            {user ? (
              <button
                className="logoutTagTow"
                onClick={() => {
                  handleLogout();
                  closeTags();
                }}
                title="تسجيل الخروج"
              >
                <MdLogout />
              </button>
            ) : (
              <Link to="/login" onClick={closeTags}>
                <button className="loginTagTow">تسجيل الدخول</button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
