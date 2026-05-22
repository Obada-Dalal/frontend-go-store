import "./advertisement.css";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { FaClock } from "react-icons/fa";

// ثابت للـ API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Advertisements() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);

  // API جلب الإعلانات من - مع useCallback
  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements`);
      const data = await res.json();
      setAds(data);
    } catch (error) {
      console.log("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // تحريك السلايدر تلقائيًا - مع تحسينات
  useEffect(() => {
    if (ads.length === 0 || isPaused) return;

    // تنظيف الـ interval القديم
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads, isPaused]);

  // إيقاف التشغيل التلقائي عند التفاعل
  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // استئناف بعد 10 ثواني
  }, []);

  // دوال التنقل المحسنة
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
    handleInteraction();
  }, [ads.length, handleInteraction]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    handleInteraction();
  }, [ads.length, handleInteraction]);

  const goToSlide = useCallback(
    (index) => {
      setCurrentIndex(index);
      handleInteraction();
    },
    [handleInteraction]
  );

  // تنسيق التاريخ - مع useCallback
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }, []);

  // Skeleton Loader
  const renderSkeleton = useMemo(
    () => (
      <div className="Box-advertisements">
        <div className="continer continerAdvertisements">
          <div className="slider-container-Advertisements skeleton-slider">
            <div className="skeleton-slide">
              <div className="skeleton-img-adv"></div>
              <div className="skeleton-info">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-dates">
                  <div className="skeleton-date"></div>
                  <div className="skeleton-date"></div>
                </div>
                <div className="skeleton-button-adv"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    []
  );

  // إذا كان في تحميل
  if (loading) return renderSkeleton;

  // إذا مافيش إعلانات
  if (ads.length === 0) return null;

  return (
    <div className="Box-advertisements">
      <div className="continer continerAdvertisements">
        <div className="slider-container-Advertisements">
          {/* أزرار التنقل الجانبية */}
          <button
            className="slider-nav prev"
            onClick={goToPrevious}
            aria-label="السابق"
          >
            ❮
          </button>
          <button
            className="slider-nav next"
            onClick={goToNext}
            aria-label="التالي"
          >
            ❯
          </button>

          <div
            className="slider"
            ref={sliderRef}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {ads.map((ad, index) => (
              <div
                className="slide"
                key={ad._id || index}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* صورة الإعلان مع Lazy Loading */}
                <img
                  className="img-adv"
                  src={ad.images?.[0] || "/default-ad.jpg"}
                  alt={ad.title}
                  loading="lazy"
                  width="350"
                  height="450"
                />

                {/* محتوى الإعلان */}
                <div className="slide-info">
                  <h1>{ad.title}</h1>
                  <p>{ad.description}</p>

                  {/* التواريخ */}
                  <div className="slide-dates">
                    <span className="date-badge">
                      <FaClock /> إلى: {formatDate(ad.endDate)}
                    </span>
                    <span className="date-badge">
                      <FaClock /> من: {formatDate(ad.startDate)}
                    </span>
                  </div>

                  {/* الزر */}
                  <a
                    href="#Shop"
                    className="slide-button"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("Shop")?.scrollIntoView({
                        behavior: "smooth"
                      });
                    }}
                  >
                    تسوق الان
                  </a>

                  {/* الأولوية (اختياري) */}
                  {ad.priority > 0 && (
                    <span className="priority-badge">
                      أولوية: {ad.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* الدوائر */}
          <div className="dots">
            {ads.map((_, index) => (
              <span
                key={index}
                className={index === currentIndex ? "dot active" : "dot"}
                onClick={() => goToSlide(index)}
                role="button"
                tabIndex={0}
                aria-label={`الانتقال إلى الإعلان ${index + 1}`}
              ></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
