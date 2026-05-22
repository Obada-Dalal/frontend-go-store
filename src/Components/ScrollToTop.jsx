import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// كائن لتخزين مواضع التمرير السابقة
const scrollPositions = {};

// دالة مساعدة لقياس ارتفاع الهيدر ديناميكياً
const getHeaderHeight = () => {
  // ابحث عن العنصر الذي يمثل شريط التنقل - استخدم الكلاس أو الآي دي الخاص بموقعك
  const header = document.querySelector(".NavBar"); // بدل '.navbar' إلى المحدد الصحيح
  if (header) {
    return header.offsetHeight;
  }
  // احتياطي: إذا لم نجد الهيدر، نعيد 0 (لن يحدث تداخل)
  return 0;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(pathname);

  // حفظ موضع التمرير عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      scrollPositions[prevPathname.current] = window.scrollY;
    };
  }, [pathname]);

  useEffect(() => {
    if (navigationType === "POP") {
      // استعادة آخر موضع تمرير للمسار عند الرجوع
      const savedY = scrollPositions[pathname];
      if (savedY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedY);
        });
      }
    } else {
      // PUSH أو REPLACE
      if (pathname.startsWith("/products")) {
        // انتظر تحميل المنتجات ثم انتقل إلى أعلى قائمة المنتجات مع مراعاة الهيدر
        const timer = setTimeout(() => {
          const target = document.getElementById("all-products");
          if (target) {
            const headerHeight = getHeaderHeight();
            const elementPosition =
              target.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          } else {
            window.scrollTo(0, 0);
          }
        }, 400); // زمن كافٍ لتحميل المنتجات
        return () => clearTimeout(timer);
      } else {
        window.scrollTo(0, 0);
      }
    }

    prevPathname.current = pathname;
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
