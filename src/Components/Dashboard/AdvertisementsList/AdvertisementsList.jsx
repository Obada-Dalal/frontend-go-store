import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../../useContexts/UserContext";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch
} from "react-icons/fa";
import { MdPriorityHigh } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import "./styleAdvertisementsList.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdvertisementsList() {
  const navigate = useNavigate();
  const { isAdmin } = useContext(UserContext);
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig] = useState({
    key: "priority",
    direction: "desc"
  });
  const [refreshing, setRefreshing] = useState(false);

  // التحقق من الصلاحية
  useEffect(() => {
    if (!isAdmin) {
      // Swal.fire({
      //   icon: "error",
      //   title: "غير مصرح",
      //   text: "هذه الصفحة للمسؤولين فقط"
      // }).then(() => navigate("/dashboard"));
    } else {
      fetchAds();
    }
  }, [isAdmin, navigate]);

  const fetchAds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/advertisements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAds(res.data);
      setFilteredAds(res.data);
    } catch (err) {
      console.error("Error fetching ads:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "حدث خطأ أثناء جلب الإعلانات"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAds();
    setRefreshing(false);
  };

  // البحث والترتيب
  useEffect(() => {
    let result = [...ads];

    if (searchTerm) {
      result = result.filter(
        (ad) =>
          ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredAds(result);
  }, [searchTerm, sortConfig, ads]);

  const handleDelete = async (adId, adTitle) => {
    const result = await Swal.fire({
      title: "تأكيد الحذف",
      html: `هل أنت متأكد من حذف الإعلان <strong>${adTitle}</strong>؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء"
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/advertisements/${adId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAds((prev) => prev.filter((ad) => ad._id !== adId));

      Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف الإعلان بنجاح",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error deleting ad:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.message || "حدث خطأ أثناء الحذف"
      });
    }
  };

  const handleToggleActive = async (adId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/advertisements/${adId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAds((prev) =>
        prev.map((ad) =>
          ad._id === adId ? { ...ad, isActive: !currentStatus } : ad
        )
      );

      Swal.fire({
        icon: "success",
        title: "تم التحديث",
        text: `تم ${!currentStatus ? "تفعيل" : "تعطيل"} الإعلان بنجاح`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error toggling ad:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.message || "حدث خطأ أثناء التحديث"
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (ad) => {
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);

    if (!ad.isActive) return { text: "معطل", class: "badge-inactive" };
    if (now < start) return { text: "مجدول", class: "badge-scheduled" };
    if (now > end) return { text: "منتهي", class: "badge-expired" };
    return { text: "نشط", class: "badge-active" };
  };

  if (loading) {
    return (
      <div className="ads-loading">
        <div className="spinner"></div>
        <p>جاري تحميل الإعلانات...</p>
      </div>
    );
  }

  return (
    <div className="ads-container">
      {/* Header */}
      <div className="ads-header">
        <div className="header-title-advertisementsList">
          <h1>📢 إدارة الإعلانات</h1>
          <p>أضف وصمم إعلاناتك الجذابة</p>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <IoMdRefresh className={refreshing ? "spin" : ""} />
            تحديث
          </button>

          <Link to="/dashboard/advertisements/add" className="add-btn">
            <FaPlus /> إعلان جديد
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="ads-search">
        <FaSearch className="search-icon advertisements" />
        <input
          type="text"
          placeholder="...بحث في الإعلانات"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Ads Grid */}
      <div className="ads-grid">
        {filteredAds.map((ad) => {
          const status = getStatusBadge(ad);
          return (
            <div
              key={ad._id}
              className={`ad-card ${!ad.isActive ? "inactive" : ""}`}
            >
              {/* صورة الإعلان */}
              <div className="ad-card-image">
                {ad.images?.[0] ? (
                  <img
                    src={ad.images[0]}
                    alt={ad.title}
                    // width="150px"
                    // height="212px"
                  />
                ) : (
                  <div className="no-image">📸</div>
                )}
                <span className={`status-badge ad ${status.class}`}>
                  {status.text}
                </span>
              </div>

              {/* محتوى الإعلان */}
              <div className="ad-card-content">
                <h3>{ad.title}</h3>
                {ad.description && (
                  <p className="ad-description">{ad.description}</p>
                )}

                <div className="ad-meta">
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>من: {formatDate(ad.startDate)}</span>
                  </div>
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>إلى: {formatDate(ad.endDate)}</span>
                  </div>
                  <div className="meta-item">
                    <MdPriorityHigh />
                    <span>أولوية: {ad.priority}</span>
                  </div>
                </div>

                {/* أزرار التحكم */}
                <div className="ad-actions">
                  <button
                    className={`action-btn toggle ${ad.isActive ? "active" : "inactive"}`}
                    onClick={() => handleToggleActive(ad._id, ad.isActive)}
                    title={ad.isActive ? "تعطيل" : "تفعيل"}
                  >
                    {ad.isActive ? <FaEye /> : <FaEyeSlash />}
                  </button>

                  <Link
                    to={`/dashboard/advertisements/edit/${ad._id}`}
                    className="action-btn edit"
                    title="تعديل"
                  >
                    <FaEdit />
                  </Link>

                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(ad._id, ad.title)}
                    title="حذف"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* لو مفيش إعلانات */}
      {filteredAds.length === 0 && (
        <div className="no-ads">
          <h3>لا توجد إعلانات</h3>
          <p>ابدأ بإضافة أول إعلان لمتجرك</p>
          <Link to="/dashboard/advertisements/add" className="add-first-btn">
            <FaPlus /> أضف إعلانك الأول
          </Link>
        </div>
      )}
    </div>
  );
}
