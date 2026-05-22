import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../useContexts/UserContext";
import Swal from "sweetalert2";

// Icons
import {
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaUser,
  FaUserCog,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaArrowLeft,
  FaArrowRight,

} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { RiAdminFill } from "react-icons/ri";
import { AiOutlineUser } from "react-icons/ai";
import { IoMdRefresh } from "react-icons/io";

import "./styleUsersManagement.css";

// ثوابت 
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const USERS_PER_PAGE = 10;

export default function UsersManagement() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useContext(UserContext);

  // حالة المستخدمين
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // حالة البحث والتصفية
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc"
  });

  // حالة التقسيم (Pagination)
  const [currentPage, setCurrentPage] = useState(1);

  // حالة المستخدم قيد التحرير
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // حالة إضافة مستخدم جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  // حالة تحديث البيانات
  const [refreshing, setRefreshing] = useState(false);

  // Refs للتحسين
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // دوال محسنة مع useCallback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error("خطأ في جلب المستخدمين:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.error || "حدث خطأ أثناء جلب المستخدمين",
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // التحقق من صلاحية الأدمن
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "تسجيل الدخول مطلوب",
        text: "يرجى تسجيل الدخول للوصول إلى لوحة التحكم",
        confirmButtonText: "تسجيل الدخول"
      }).then(() => {
        navigate("/login");
      });
    } else {
      fetchUsers();
    }
  }, [isAdmin, navigate, fetchUsers]);

  // تحديث البيانات
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  // البحث والتصفية - useMemo للتحسين
  useEffect(() => {
    if (initialLoad) return;

    const filterTimeout = setTimeout(() => {
      let result = [...users];

      // فلترة حسب البحث
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        );
      }

      // فلترة حسب الدور
      if (roleFilter !== "all") {
        result = result.filter((user) => user.role === roleFilter);
      }

      // ترتيب
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "createdAt") {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        }

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

      setFilteredUsers(result);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [searchTerm, roleFilter, sortConfig, users, initialLoad]);

  // طلب الترتيب
  const requestSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  // الحصول على أيقونة الترتيب
  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) return <FaSort />;
      return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    },
    [sortConfig]
  );

  // إضافة مستخدم جديد
  const handleAddUser = useCallback(
    async (e) => {
      e.preventDefault();

      // التحقق من المدخلات
      if (
        !newUser.name.trim() ||
        !newUser.email.trim() ||
        !newUser.password.trim()
      ) {
        Swal.fire({
          icon: "warning",
          title: "تنبيه",
          text: "جميع الحقول مطلوبة",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      if (newUser.password.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "تنبيه",
          text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(`${API_BASE_URL}/api/register`, newUser, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        setUsers((prev) => [...prev, response.data.user]);
        setShowAddModal(false);
        setNewUser({ name: "", email: "", password: "", role: "user" });

        Swal.fire({
          icon: "success",
          title: "تم الإضافة",
          text: "تم إضافة المستخدم بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("خطأ في إضافة المستخدم:", err);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text:
            err.response?.data?.error ||
            err.response?.data?.message ||
            "حدث خطأ أثناء إضافة المستخدم",
          timer: 2000,
          showConfirmButton: false
        });
      }
    },
    [newUser]
  );

  // تعديل مستخدم
  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setShowEditModal(true);
  }, []);

  const handleUpdateUser = useCallback(
    async (e) => {
      e.preventDefault();

      if (!editingUser.name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "تنبيه",
          text: "الاسم مطلوب",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const updateData = {
          name: editingUser.name,
          role: editingUser.role
        };

        if (editingUser.email) {
          updateData.email = editingUser.email;
        }

        const response = await axios.put(
          `${API_BASE_URL}/api/users/${editingUser._id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        setUsers((prev) =>
          prev.map((u) => (u._id === editingUser._id ? response.data : u))
        );

        setShowEditModal(false);
        setEditingUser(null);

        Swal.fire({
          icon: "success",
          title: "تم التحديث",
          text: "تم تحديث بيانات المستخدم بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("خطأ في تحديث المستخدم:", err);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: err.response?.data?.error || "حدث خطأ أثناء تحديث المستخدم",
          timer: 2000,
          showConfirmButton: false
        });
      }
    },
    [editingUser]
  );

  // تغيير صلاحية المستخدم
  const handleToggleRole = useCallback(async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "ترقية" : "تنزيل";
    const roleName = newRole === "admin" ? "أدمن" : "مستخدم عادي";

    const result = await Swal.fire({
      title: `تأكيد ${action} الصلاحية`,
      text: `هل أنت متأكد من ${action} هذا المستخدم إلى ${roleName}؟`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newRole === "admin" ? "#28a745" : "#ffc107",
      cancelButtonColor: "#d33",
      confirmButtonText: `نعم، ${action}`,
      cancelButtonText: "إلغاء"
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_BASE_URL}/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      Swal.fire({
        icon: "success",
        title: "تم التغيير",
        text: `تم ${action} المستخدم إلى ${roleName} بنجاح`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("خطأ في تغيير الصلاحية:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.error || "حدث خطأ أثناء تغيير الصلاحية",
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, []);

  // حذف مستخدم
  const handleDeleteUser = useCallback(
    async (userId, userName) => {
      if (userId === currentUser?.id) {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "لا يمكنك حذف حسابك الخاص",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      const result = await Swal.fire({
        title: "تأكيد الحذف",
        html: `هل أنت متأكد من حذف المستخدم <strong>${userName}</strong>؟`,
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

        await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUsers((prev) => prev.filter((u) => u._id !== userId));

        Swal.fire({
          icon: "success",
          title: "تم الحذف",
          text: "تم حذف المستخدم بنجاح",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("خطأ في حذف المستخدم:", err);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: err.response?.data?.error || "حدث خطأ أثناء حذف المستخدم",
          timer: 2000,
          showConfirmButton: false
        });
      }
    },
    [currentUser?.id]
  );

  // تنسيق التاريخ
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "غير محدد";
    }
  }, []);

  // حساب مؤشرات المستخدمين - useMemo للتحسين
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const regular = total - admins;
    const newToday = users.filter((u) => {
      if (!u.createdAt) return false;
      try {
        const today = new Date();
        const userDate = new Date(u.createdAt);
        return userDate.toDateString() === today.toDateString();
      } catch {
        return false;
      }
    }).length;

    return { total, admins, regular, newToday };
  }, [users]);

  // تجهيز البيانات للصفحة الحالية - useMemo للتحسين
  const { currentUsers, totalPages } = useMemo(() => {
    const indexOfLastUser = currentPage * USERS_PER_PAGE;
    const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
    const current = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const total = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    return { currentUsers: current, totalPages: total };
  }, [filteredUsers, currentPage]);

  // Skeleton Loader
  // eslint-disable-next-line no-unused-vars
  const renderSkeletons = useCallback(() => {
    return [...Array(5)].map((_, i) => (
      <tr key={i} className="skeleton-row">
        <td>
          <div
            className="skeleton-cell"
            style={{ width: "30px", height: "20px" }}
          ></div>
        </td>
        <td>
          <div className="user-info skeleton">
            <div className="skeleton-avatar"></div>
            <div className="user-details">
              <div
                className="skeleton-text"
                style={{ width: "120px", height: "16px" }}
              ></div>
            </div>
          </div>
        </td>
        <td>
          <div
            className="skeleton-cell"
            style={{ width: "150px", height: "16px" }}
          ></div>
        </td>
        <td>
          <div
            className="skeleton-cell"
            style={{ width: "80px", height: "30px" }}
          ></div>
        </td>
        <td>
          <div
            className="skeleton-cell"
            style={{ width: "100px", height: "16px" }}
          ></div>
        </td>
        <td>
          <div className="action-buttons skeleton">
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
          </div>
        </td>
      </tr>
    ));
  }, []);

  // إغلاق المودال عند الضغط على ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="users-management-container">
      {/* Header */}
      <div className="users-header">
        <div className="header-title">
          <h1>
            <FaUserCog /> إدارة المستخدمين
          </h1>
          <p>إدارة المستخدمين والصلاحيات في الموقع</p>
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

          <button
            className="add-user-btn"
            onClick={() => setShowAddModal(true)}
          >
            <FaUserPlus /> إضافة مستخدم
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaUser />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي المستخدمين</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card admins">
          <div className="stat-icon">
            <RiAdminFill />
          </div>
          <div className="stat-info">
            <span className="stat-label">المسؤولين</span>
            <span className="stat-value">{stats.admins}</span>
          </div>
        </div>

        <div className="stat-card users">
          <div className="stat-icon">
            <AiOutlineUser />
          </div>
          <div className="stat-info">
            <span className="stat-label">المستخدمين العاديين</span>
            <span className="stat-value">{stats.regular}</span>
          </div>
        </div>

        <div className="stat-card new">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <span className="stat-label">جديد اليوم</span>
            <span className="stat-value">{stats.newToday}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box-user-mangement">
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="... بحث باسم المستخدم أو البريد الإلكتروني"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">جميع المستخدمين</option>
            <option value="admin">المسؤولين فقط</option>
            <option value="user">المستخدمين العاديين فقط</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>جاري تحميل المستخدمين...</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المستخدم</th>
                  <th onClick={() => requestSort("email")}>
                    البريد الإلكتروني {getSortIcon("email")}
                  </th>
                  <th onClick={() => requestSort("role")}>
                    الصلاحية {getSortIcon("role")}
                  </th>
                  <th onClick={() => requestSort("createdAt")}>
                    تاريخ التسجيل {getSortIcon("createdAt")}
                  </th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      className={user.role === "admin" ? "admin-row" : ""}
                    >
                      <td>{(currentPage - 1) * USERS_PER_PAGE + index + 1}</td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            {user._id === currentUser?.id && (
                              <span className="current-user-badge">أنت</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{
                            backgroundColor:
                              user.role === "admin" ? "#ff4757" : "#2ed573",
                            color: "white"
                          }}
                        >
                          {user.role === "admin" ? (
                            <MdAdminPanelSettings className="role-icon" />
                          ) : (
                            <AiOutlineUser className="role-icon" />
                          )}
                          {user.role === "admin" ? "أدمن" : "مستخدم"}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEditUser(user)}
                            title="تعديل"
                          >
                            <FaEdit />
                          </button>

                          {user.role === "admin" ? (
                            <button
                              className="demote-btn"
                              onClick={() =>
                                handleToggleRole(user._id, user.role)
                              }
                              title="تنزيل إلى مستخدم"
                              disabled={user._id === currentUser?.id}
                            >
                              <FaUser />
                            </button>
                          ) : (
                            <button
                              className="promote-btn"
                              onClick={() =>
                                handleToggleRole(user._id, user.role)
                              }
                              title="ترقية إلى أدمن"
                            >
                              <FaUserShield />
                            </button>
                          )}

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDeleteUser(user._id, user.name)
                            }
                            title="حذف"
                            disabled={user._id === currentUser?.id}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">
                      لا توجد نتائج مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="page-nav"
              >
                <FaArrowRight />
              </button>

              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="page-nav"
              >
                <FaArrowLeft />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-users-management"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <div className="modal-header">
              <h2>
                <FaUserPlus /> إضافة مستخدم جديد
              </h2>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="أدخل الاسم"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="أدخل البريد الإلكتروني"
                  required
                />
              </div>

              <div className="form-group">
                <label>كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="أدخل كلمة المرور"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>الصلاحية</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="user">مستخدم عادي</option>
                  <option value="admin">أدمن</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  <FaCheckCircle /> إضافة
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  <FaTimesCircle /> إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content-users-management"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <FaEdit /> تعديل المستخدم
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  placeholder="أدخل الاسم"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  placeholder="أدخل البريد الإلكتروني"
                  required
                />
              </div>

              <div className="form-group">
                <label>الصلاحية</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="user">مستخدم عادي</option>
                  <option value="admin">أدمن</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  <FaCheckCircle /> تحديث
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
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
