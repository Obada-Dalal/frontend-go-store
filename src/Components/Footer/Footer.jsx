// librarys
import "./footer.css";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { MdDoubleArrow } from "react-icons/md";
// Icon
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { FaMapLocationDot } from "react-icons/fa6";
import { IoCall } from "react-icons/io5";
import { GoClockFill } from "react-icons/go";
import { MdEmail } from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Footer({ onSearchSelect }) {
  const categoriesRef = useRef(null);
  const [categories, setCategories] = useState([]);

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

  return (
    <>
      <div id="footer" className="footer">
        {/* *** about-us قسم  */}
        <div className="about-us">
          <div className="logo">
            <img
              style={{ width: "140px" }}
              src="../../../public/Images/svgFooterLogo.svg"
              alt="Smart Gear Store Logo"
            />
          </div>
          <p>
            نحن متجر متخصص في تقديم أجود أنواع الإكسسوارات التقنية التي تجمع بين
            الأناقة والكفاءة. نوفر لك أحدث المنتجات بجودة عالية وأسعار منافسة،
            مع خدمة توصيل سريعة. تسوق الآن وارتقِ بتجربتك التقنية.
          </p>

          {/* ✅ أيقونات وسائل التواصل - تحسين احترافي */}
          {/* ✅ أيقونات وسائل التواصل - مع كلاس مخصص لكل تطبيق */}
          <div className="social-icons">
            <a
              href="https://www.instagram.com/smart_gear_store"
              className="social-icon instagram"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              className="social-icon facebook"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook />
            </a>
            <a
              href="https://wa.me/963947584270?text=مرحباً%20،%20لدي%20استفسار%20عن%20المنتجات"
              className="social-icon whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
        {/*  about-us قسم  ****/}

        {/* *** sochials قسم  */}
        <div className="box-sochials">
          <h2>تواصل معنا </h2>
          <div className="sochial">
            <i>
              <FaMapLocationDot />
            </i>
            <div className="text">
              {/* <p>موقعنا</p> */}
              <span>Syria, Damascus</span>
            </div>
          </div>
          <div className="sochial">
            <i>
              <IoCall />
            </i>
            <div className="text">
              {/* <p>للأتصال</p> */}
              <span>+963 947 584 270</span>
              <br />
              <span>+963 982 359 538</span>
            </div>
          </div>
          <div className="sochial">
            <i>
              <GoClockFill />
            </i>
            <div className="text">
              {/* <p>اوقات العمل</p> */}
              <span>اوقات العمل: 10:00 - 18:00</span>
            </div>
          </div>
          <div className="sochial">
            <i>
              <MdEmail />
            </i>
            <div className="text">
              {/* <p>Email Us</p> */}
              <span>SmartGearStore@gmail.com</span>
            </div>
          </div>
        </div>
        {/*  sochials قسم  *** */}

        {/* *** Categoriess قسم  */}
        <div className="Categoriess">
          <h2>الفئات الأساسية</h2>
          <div className="Categorie" ref={categoriesRef}>
            <ul>
              <li>
                <Link to="/products" state={{ fromLink: true }}>
                  جميع المنتجات
                </Link>
              </li>
              {categories.map((cat, index) => (
                <li key={index}>
                  <Link
                    to={`/products/${cat.slug}`}
                    state={{ fromLink: true }}
                    onClick={() => onSearchSelect && onSearchSelect(null)}
                  >
                    {cat.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/*  Categoriess قسم *** */}

        {/* *** quick-links قسم  */}
        <div className="quick-links">
          <h2>روابط اخرى</h2>
          <ul>
            <li>
              <MdDoubleArrow />
              <a href="#Home">الرئيسية</a>
            </li>
            <li>
              <MdDoubleArrow />
              <a href="#Shop">تسوق الأن</a>
            </li>
            <li>
              <MdDoubleArrow />
              <a href="#services">الخدمات</a>
            </li>
            <li>
              <MdDoubleArrow />
              <a href="#Contact Us">تواصل معنا</a>
            </li>
            {/* <li>
              <MdDoubleArrow />
              <a href="#footer">Help</a>
            </li> */}
          </ul>
        </div>
        {/*  quick-links قسم *** */}
      </div>

      <div className="copywrite">
        © 2026 <span>SmartGearStore</span>. All rights reserved.
      </div>
    </>
  );
}
