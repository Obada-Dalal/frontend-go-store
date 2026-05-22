import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef
} from "react";
import { OrderContext } from "../../../useContexts/OrderContext";
import { UserContext } from "../../../useContexts/UserContext";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./styleOrdersManagement.css";
import {
  FaBox,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaCog,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUser,
  FaWhatsapp
} from "react-icons/fa";
import { MdDeliveryDining, MdPendingActions, MdCancel } from "react-icons/md";

// ثوابت
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ORDERS_PER_PAGE = 20;

export default function OrdersManagemen() {
  const { getOrderStatus } = useContext(OrderContext);
  const { user, logoutUser, loading: userLoading } = useContext(UserContext);
  const navigate = useNavigate();

  // Refs للتحسين
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);
  const editModalRef = useRef(null); // ✅ ref للمودال

  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    dateFrom: "",
    dateTo: ""
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: ORDERS_PER_PAGE
  });

  // Cleanup على unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // دوال محسنة مع useCallback
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/orders?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (isMounted.current) {
        setOrders(response.data.orders);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          total: response.data.total
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        if (logoutUser) logoutUser();

        if (isMounted.current) {
          await Swal.fire({
            icon: "error",
            title: "انتهت الجلسة",
            text: "يرجى تسجيل الدخول مرة أخرى",
            confirmButtonText: "تسجيل الدخول"
          });
          navigate("/login");
        }
      } else {
        if (isMounted.current) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "حدث خطأ أثناء جلب الطلبات"
          });
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.limit, filters, navigate, logoutUser]);

  // جلب الإحصائيات
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/orders/stats/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (isMounted.current) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        if (logoutUser) logoutUser();
      }
    }
  }, [logoutUser]);

  // التحقق من التوكن وصلاحية الأدمن
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "تسجيل الدخول مطلوب",
          text: "يجب تسجيل الدخول أولاً",
          confirmButtonText: "تسجيل الدخول"
        });
        navigate("/login");
        return;
      }

      if (userLoading) return;

      if (!user || user?.role !== "admin") {
        await Swal.fire({
          icon: "error",
          title: "غير مصرح",
          text: "ليس لديك صلاحية الوصول لهذه الصفحة",
          confirmButtonText: "العودة للرئيسية"
        });
        navigate("/");
        return;
      }

      fetchOrders();
      fetchStats();
    };

    checkAuth();
  }, [user, userLoading, navigate, fetchOrders, fetchStats]);

  // تطبيق الفلاتر مع debounce
  const applyFilters = useCallback(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchOrders();
    }, 500);
  }, [fetchOrders]);

  // ✅ فتح مودال تحديث الحالة مع التمرير
  const openEditModal = useCallback((order) => {
    setSelectedOrder(order);
    setShowEditModal(true);

    // التمرير إلى المودال بعد ظهوره
    setTimeout(() => {
      if (editModalRef.current) {
        editModalRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }, 100);
  }, []);

  // تحديث حالة الطلب
  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const result = await Swal.fire({
          title: "تحديث حالة الطلب",
          text: `هل أنت متأكد من تغيير حالة الطلب إلى ${getOrderStatus(newStatus).text}؟`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "نعم، تحديث",
          cancelButtonText: "إلغاء",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33"
        });

        if (result.isConfirmed) {
          setUpdatingId(orderId);

          await axios.put(
            `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
            { status: newStatus },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (isMounted.current) {
            Swal.fire({
              icon: "success",
              title: "تم التحديث",
              text: "تم تحديث حالة الطلب بنجاح",
              timer: 1500,
              showConfirmButton: false
            });

            fetchOrders();
            fetchStats();
            setShowEditModal(false);
          }
        }
      } catch (error) {
        console.error("Error updating order:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          if (logoutUser) logoutUser();
          navigate("/login");
        } else {
          if (isMounted.current) {
            Swal.fire({
              icon: "error",
              title: "خطأ",
              text: error.response?.data?.error || "حدث خطأ أثناء تحديث الحالة"
            });
          }
        }
      } finally {
        if (isMounted.current) {
          setUpdatingId(null);
        }
      }
    },
    [getOrderStatus, navigate, logoutUser, fetchOrders, fetchStats]
  );

  // حذف طلب
  const deleteOrder = useCallback(
    async (orderId) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const result = await Swal.fire({
          title: "حذف الطلب",
          text: "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "نعم، حذف",
          cancelButtonText: "إلغاء",
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6"
        });

        if (result.isConfirmed) {
          setDeletingId(orderId);

          await axios.delete(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (isMounted.current) {
            Swal.fire({
              icon: "success",
              title: "تم الحذف",
              text: "تم حذف الطلب بنجاح",
              timer: 1500,
              showConfirmButton: false
            });

            fetchOrders();
            fetchStats();
          }
        }
      } catch (error) {
        console.error("Error deleting order:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          if (logoutUser) logoutUser();
          navigate("/login");
        } else {
          if (isMounted.current) {
            Swal.fire({
              icon: "error",
              title: "خطأ",
              text: error.response?.data?.error || "حدث خطأ أثناء حذف الطلب"
            });
          }
        }
      } finally {
        if (isMounted.current) {
          setDeletingId(null);
        }
      }
    },
    [navigate, logoutUser, fetchOrders, fetchStats]
  );

  // تصدير التقرير
  const exportOrders = useCallback(() => {
    if (orders.length === 0) {
      Swal.fire({
        icon: "info",
        title: "لا توجد بيانات",
        text: "لا توجد طلبات لتصديرها"
      });
      return;
    }

    const data = orders.map((order) => ({
      "رقم الطلب": order._id.slice(-8),
      العميل: order.userId?.name || "غير معروف",
      "البريد الإلكتروني": order.userId?.email || "",
      الإجمالي: order.totalAmount,
      الحالة: getOrderStatus(order.status).text,
      التاريخ: new Date(order.orderDate).toLocaleDateString("ar-EG"),
      "عدد المنتجات": order.items.length
    }));

    const csv = convertToCSV(data);
    downloadCSV(csv, `الطلبات-${new Date().toLocaleDateString()}.csv`);

    Swal.fire({
      icon: "success",
      title: "تم التصدير",
      text: "تم تصدير التقرير بنجاح",
      timer: 1500,
      showConfirmButton: false
    });
  }, [orders, getOrderStatus]);

  const convertToCSV = (data) => {
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((obj) => Object.values(obj).join(","));
    return [header, ...rows].join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "غير محدد";
    }
  }, []);

  // Pagination numbers
  const paginationNumbers = useMemo(() => {
    const { page, totalPages } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.totalPages]);

  // Skeleton Loader
  // eslint-disable-next-line no-unused-vars
  const renderSkeletons = useCallback(() => {
    return [...Array(5)].map((_, i) => (
      <tr key={i} className="skeleton-row">
        <td>
          <div className="skeleton-cell" style={{ width: "60px" }}></div>
        </td>
        <td>
          <div className="customer-info skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text" style={{ width: "100px" }}></div>
          </div>
        </td>
        <td>
          <div className="skeleton-cell" style={{ width: "120px" }}></div>
        </td>
        <td>
          <div className="skeleton-cell" style={{ width: "150px" }}></div>
        </td>
        <td>
          <div className="skeleton-cell" style={{ width: "60px" }}></div>
        </td>
        <td>
          <div className="skeleton-cell" style={{ width: "80px" }}></div>
        </td>
        <td>
          <div className="skeleton-cell" style={{ width: "80px" }}></div>
        </td>
        <td>
          <div className="action-buttons skeleton">
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
          </div>
        </td>
      </tr>
    ));
  }, []);

  if (userLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-order"></div>
        <p>جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  if (!user || user?.role !== "admin") {
    return (
      <div className="loading-spinner">
        <div className="spinner-order"></div>
        <p>جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      {/* Header with Stats */}
      <div className="admin-header">
        <h1>
          <FaBox /> إدارة الطلبات
        </h1>
        <p>مرحباً {user?.name} - في لوحة تحكم الأدمن</p>
        <div className="stats-cards">
          <div className="stat-card total">
            <span className="stat-icon">📦</span>
            <div className="stat-info">
              <h3>{stats.totalOrders}</h3>
              <p>إجمالي الطلبات</p>
            </div>
          </div>
          <div className="stat-card pending">
            <span className="stat-icon">⏳</span>
            <div className="stat-info">
              <h3>{stats.pendingOrders}</h3>
              <p>قيد الانتظار</p>
            </div>
          </div>
          <div className="stat-card processing">
            <span className="stat-icon">⚙️</span>
            <div className="stat-info">
              <h3>{stats.processingOrders}</h3>
              <p>قيد التجهيز</p>
            </div>
          </div>
          <div className="stat-card shipped">
            <span className="stat-icon">🚚</span>
            <div className="stat-info">
              <h3>{stats.shippedOrders}</h3>
              <p>تم الشحن</p>
            </div>
          </div>
          <div className="stat-card delivered">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <h3>{stats.deliveredOrders}</h3>
              <p>تم التوصيل</p>
            </div>
          </div>
          <div className="stat-card cancelled">
            <span className="stat-icon">❌</span>
            <div className="stat-info">
              <h3>{stats.cancelledOrders}</h3>
              <p>ملغي</p>
            </div>
          </div>
          <div className="stat-card revenue">
            <span className="stat-icon">💰</span>
            <div className="stat-info">
              <h3>${stats.totalRevenue}</h3>
              <p>الإيرادات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="admin-filters">
        <div className="search-box-order">
          <FaSearch className="search-icon-order" />
          <input
            type="text"
            placeholder="بحث برقم الطلب أو اسم العميل..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyUp={applyFilters}
          />
          {filters.search && (
            <button
              className="clear-search-order"
              onClick={() => {
                setFilters({ ...filters, search: "" });
                applyFilters();
              }}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              applyFilters();
            }}
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغي</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />

          <button onClick={applyFilters} className="filter-btn">
            <FaFilter /> تصفية
          </button>

          <button onClick={exportOrders} className="export-btn">
            <FaDownload /> تصدير
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-order"></div>
          <p>جاري تحميل الطلبات...</p>
        </div>
      ) : (
        <div className="orders-table-container">
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>لا توجد طلبات لعرضها</p>
            </div>
          ) : (
            <>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>المنتجات</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>تأكيد العميل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = getOrderStatus(order.status);
                    const isUpdating = updatingId === order._id;
                    const isDeleting = deletingId === order._id;

                    return (
                      <tr
                        key={order._id}
                        className={isDeleting ? "deleting" : ""}
                      >
                        <td>#{order._id.slice(-8)}</td>
                        <td>
                          <div className="customer-info">
                            <FaUser className="customer-icon" />
                            <div>
                              <strong>
                                {order.userId?.name || "غير معروف"}
                              </strong>
                              <small>{order.userId?.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(order.orderDate)}</td>
                        <td>
                          <div className="products-preview">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="product-tag">
                                {item.productName} ({item.quantity})
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="more-products">
                                +{order.items.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="total-amount">${order.totalAmount}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: status.color + "20",
                              color: status.color,
                              borderColor: status.color
                            }}
                          >
                            {status.icon} {status.text}
                          </span>
                        </td>
                        <td>
                          {order.deliveryConfirmedByUser ? (
                            <span className="confirmed-badge">
                              <FaCheckCircle /> تم التأكيد
                            </span>
                          ) : (
                            <span className="not-confirmed-badge">
                              <FaTimesCircle /> لم يؤكد
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailsModal(true);
                              }}
                              title="عرض التفاصيل"
                              disabled={isUpdating || isDeleting}
                            >
                              <FaEye />
                            </button>
                            <button
                              className="action-btn edit"
                              onClick={() => openEditModal(order)}
                              title="تحديث الحالة"
                              disabled={isUpdating || isDeleting}
                            >
                              {isUpdating ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <FaEdit />
                              )}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => deleteOrder(order._id)}
                              title="حذف"
                              disabled={isUpdating || isDeleting}
                            >
                              {isDeleting ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <FaTrash />
                              )}
                            </button>
                            <a
                              href={`https://wa.me/+963982359538?text=${encodeURIComponent(
                                `استفسار بخصوص الطلب #${order._id} للعميل ${order.userId?.name || ""}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`action-btn whatsapp ${isUpdating || isDeleting ? "disabled" : ""}`}
                              title="تواصل واتساب"
                              onClick={(e) => {
                                if (isUpdating || isDeleting)
                                  e.preventDefault();
                              }}
                            >
                              <FaWhatsapp />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => {
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(prev.page - 1, 1)
                      }));
                      fetchOrders();
                    }}
                    disabled={pagination.page === 1}
                  >
                    السابق
                  </button>

                  {paginationNumbers.map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span key={`dots-${index}`} className="pagination-dots">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setPagination((prev) => ({ ...prev, page: pageNum }));
                          fetchOrders();
                        }}
                        className={`page-btn ${pagination.page === pageNum ? "active" : ""}`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.page + 1, pagination.totalPages)
                      }));
                      fetchOrders();
                    }}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    التالي
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="modal-orders-managemen details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <button
                className="close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
              <h2>
                <p>تفاصيل الطلب : {selectedOrder._id.slice(-8)}#</p>
              </h2>
            </div>

            {/* <button
              className="close-modal"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </button>
            <h2>تفاصيل الطلب #{selectedOrder._id.slice(-8)}</h2> */}

            <div className="order-info-section">
              <h3>معلومات العميل</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">الاسم:</span>
                  <span className="info-value">
                    {selectedOrder.userId?.name}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">البريد الإلكتروني:</span>
                  <span className="info-value">
                    {selectedOrder.userId?.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-info-section">
              <h3>معلومات الطلب</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">تاريخ الطلب:</span>
                  <span className="info-value">
                    {formatDate(selectedOrder.orderDate)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">الحالة:</span>
                  <span
                    className="info-value"
                    style={{
                      color: getOrderStatus(selectedOrder.status).color
                    }}
                  >
                    {getOrderStatus(selectedOrder.status).text}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">الإجمالي:</span>
                  <span className="info-value">
                    ${selectedOrder.totalAmount}
                  </span>
                </div>
                {selectedOrder.deliveredDate && (
                  <div className="info-row">
                    <span className="info-label">تاريخ التوصيل:</span>
                    <span className="info-value">
                      {formatDate(selectedOrder.deliveredDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="order-info-section table">
              <h3>المنتجات</h3>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>اللون</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="product-cell">
                          <img
                            src={
                              item.productImage ||
                              item.productId?.images?.[0] ||
                              "/Images/default-product.jpg"
                            }
                            alt={item.productName}
                            className="product-thumb"
                            loading="lazy"
                          />
                          <span>{item.productName}</span>
                        </div>
                      </td>
                      <td>{item.color}</td>
                      <td>{item.quantity}</td>
                      <td>${item.priceAtOrder}</td>
                      <td>${item.priceAtOrder * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal - بنفس تنسيق Users Management */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-orders-managemen edit-modal"
            onClick={(e) => e.stopPropagation()}
            ref={editModalRef}
          >
            <div className="modal-header">
              <h2>
                <FaEdit /> تحديث حالة الطلب
              </h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="status-options">
                <button
                  type="button"
                  className={`status-option ${selectedOrder.status === "pending" ? "active" : ""}`}
                  onClick={() =>
                    updateOrderStatus(selectedOrder._id, "pending")
                  }
                  disabled={updatingId === selectedOrder._id}
                >
                  <MdPendingActions /> قيد الانتظار
                </button>
                <button
                  type="button"
                  className={`status-option ${selectedOrder.status === "processing" ? "active" : ""}`}
                  onClick={() =>
                    updateOrderStatus(selectedOrder._id, "processing")
                  }
                  disabled={updatingId === selectedOrder._id}
                >
                  <FaCog /> قيد التجهيز
                </button>
                <button
                  type="button"
                  className={`status-option ${selectedOrder.status === "shipped" ? "active" : ""}`}
                  onClick={() =>
                    updateOrderStatus(selectedOrder._id, "shipped")
                  }
                  disabled={updatingId === selectedOrder._id}
                >
                  <FaTruck /> تم الشحن
                </button>
                <button
                  type="button"
                  className={`status-option ${selectedOrder.status === "delivered" ? "active" : ""}`}
                  onClick={() =>
                    updateOrderStatus(selectedOrder._id, "delivered")
                  }
                  disabled={updatingId === selectedOrder._id}
                >
                  <FaCheckCircle /> تم التوصيل
                </button>
                <button
                  type="button"
                  className={`status-option ${selectedOrder.status === "cancelled" ? "active" : ""}`}
                  onClick={() =>
                    updateOrderStatus(selectedOrder._id, "cancelled")
                  }
                  disabled={updatingId === selectedOrder._id}
                >
                  <MdCancel /> ملغي
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  <FaTimesCircle /> إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
