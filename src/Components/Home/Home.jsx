import "./Home.css";
import NavBar from "../NavBar/NavBar";
import { useState, useEffect } from "react";
import { UserContext } from "../../useContexts/UserContext";
import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import Advertisement from "../ِAdvertisement/Advertisement";
import Services from "../Services/Services";
import Contact from "../contact/Contact";
import Welcome from "../welcome/Welcome";
import Categories from "../categories/DropdownCategories";
import LatestProducts from "../latestProducts/LatestProducts";
import ChargerProductsSlider from "../ChargerProductsSlider/ChargerProductsSlider";
import CategoryImage from "../CategoryImage/CategoryImage";
import DiscountProducts from "../Discounts/DiscountProducts";

// في نفس الملف Home.jsx - حل بديل
export default function Home() {
  // const { user } = useContext(UserContext);
  const [searchKeyword, setSearchKeyword] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    // استخدام دالة مهيئة للـ state للتحقق من الحالة فوراً
    const hasSeenInSession = sessionStorage.getItem("welcomeShownInSession");
    return !hasSeenInSession; // إذا لم يتم عرضها من قبل، نعرضها
  });
  const [showContent, setShowContent] = useState(() => {
    const hasSeenInSession = sessionStorage.getItem("welcomeShownInSession");
    return !!hasSeenInSession; // إذا تم عرضها من قبل، نظهر المحتوى مباشرة
  });

  useEffect(() => {
    if (showWelcome) {
      // إذا كنا سنعرض الترحيب
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        setShowWelcome(false);
        setShowContent(true);
        document.body.style.overflow = "auto";
        sessionStorage.setItem("welcomeShownInSession", "true");
      }, 5000);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "auto";
      };
    }
  }, [showWelcome]);

  return (
    <>
      {showWelcome && <Welcome />}

      {showContent && (
        <>
          <NavBar onSearchSelect={(name) => setSearchKeyword(name)} />
          <div className="Box">
            <div className="continer">
              {/* <div>
                <h1>الصفحة الرئيسية</h1>
                {user ? (
                  <p>
                    مرحباً {user.name}، بريدك هو {user.email}
                  </p>
                ) : (
                  <p>لم تقم بتسجيل الدخول بعد</p>
                )}
              </div> */}
              <Advertisement />
              <CategoryImage />
              <LatestProducts />
              <DiscountProducts />
              <ChargerProductsSlider />
              <Outlet context={{ searchKeyword, setSearchKeyword }} />
              <Services />
              <Contact />
            </div>
          </div>
          <Footer onSearchSelect={setSearchKeyword} />
        </>
      )}
    </>
  );
}
