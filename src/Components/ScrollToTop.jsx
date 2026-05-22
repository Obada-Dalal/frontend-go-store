import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"

  useEffect(() => {
    // نتجاهل تماماً التنقل عن طريق زر العودة أو التقدم
    if (navigationType === "POP") {
      return;
    }

    // إذا كان المسار يبدأ بـ /products، ننتقل إلى قائمة المنتجات
    if (pathname.startsWith("/products")) {
      const timer = setTimeout(() => {
        const target = document.getElementById("all-products");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo(0, 0);
        }
      }, 200);
      return () => clearTimeout(timer);
    }

    // لبقية الصفحات، تمرير عادي إلى الأعلى
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
