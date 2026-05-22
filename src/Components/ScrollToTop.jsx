import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SCROLL_POSITIONS_KEY = "scrollPositions";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") {
      // استعادة آخر موضع تمرير عند الرجوع
      const saved = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
      if (saved) {
        const positions = JSON.parse(saved);
        if (positions[pathname] !== undefined) {
          requestAnimationFrame(() => {
            window.scrollTo(0, positions[pathname]);
          });
        }
      }
    } else {
      // سلوك التنقل العادي (إما للأعلى أو لقسم المنتجات)
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
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, navigationType]);

  useEffect(() => {
    const savePosition = () => {
      const saved = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
      const positions = saved ? JSON.parse(saved) : {};
      positions[pathname] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    };

    window.addEventListener("beforeunload", savePosition);
    return () => {
      savePosition();
      window.removeEventListener("beforeunload", savePosition);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
