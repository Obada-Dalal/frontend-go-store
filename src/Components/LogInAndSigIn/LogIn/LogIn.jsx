import { Link, useNavigate } from "react-router-dom";
import "../../LogInAndSigIn/styleAuthLogInAndSignin.css";
import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../../../useContexts/UserContext";
import { CartContext } from "../../../useContexts/CartContext";
import Swal from "sweetalert2";

// أيقونة العين SVG
const EyeIcon = ({ visible, onClick }) => (
  <span className="eye-icon" onClick={onClick}>
    {visible ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </span>
);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


export default function LogIN() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState({
    email: "",
    password: ""
  });

  const { loginUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { refreshCart } = useContext(CartContext);

  // منع السكرول أثناء التحميل
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        email: inputValue.email,
        password: inputValue.password
      });

      if (response.data.user && response.data.token) {
        localStorage.setItem("token", response.data.token);
        window.dispatchEvent(new Event("user-login"));

        const userData = {
          ...response.data.user,
          role: response.data.user.role || "user"
        };
        loginUser(userData);
        refreshCart();

        let welcomeMessage = `${userData.name} مرحباً بك👋`;
        let db = "يمكنك الآن الوصول إلى لوحة التحكم";
        let h = "- مرحباً بك أدمن ";
        let u = userData.name;

        if (userData.role === "admin") {
          welcomeMessage = ` ${h} ${u} ${db}  `;
        } else if (userData.role === "user") {
          welcomeMessage = `مرحباً بك في موقعنا - تم تسجيل دخولك بنجاح`;
        }

        setLoading(false);

        await Swal.fire({
          icon: "success",
          title: "تم تسجيل الدخول بنجاح",
          text: welcomeMessage, // رسالتك المختلطة
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "swal-custom-popup", // تفعيل اتجاه RTL وتنسيق عام
            htmlContainer: "swal-mixed-text", // الحل السحري للنص المختلط
            confirmButton: "swal-custom-confirm",
            cancelButton: "swal-custom-cancel"
          }
        });

        navigate("/");
      } else {
        setLoading(false);
        await Swal.fire({
          icon: "error",
          title: "فشل تسجيل الدخول",
          text: "البيانات غير صحيحة"
        });
      }
    } catch (err) {
      setLoading(false);

      let errorMessage = "حدث خطأ أثناء الاتصال بالسيرفر.";

      if (err.response?.data?.errors?.length) {
        errorMessage = err.response.data.errors[0].msg;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text: errorMessage,
        confirmButtonText: "حسناً",
        customClass: {
          popup: "swal-custom-popup",
          htmlContainer: "swal-mixed-text",
          confirmButton: "swal-custom-confirm"
        }
      });
    }
  };

  return (
    <>
      <div className="overRotate">
        <div className="continerLogIN backgroundLogIN">
          {/* الخلفية المتحركة - 5 دوائر */}
          <div className="background-circles">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="BoxLogIN">
            <form onSubmit={handleSubmit}>
              <img src="/Images/svgFooterLogo.svg" alt="Logo" />
              <div className="title">
                <h1>تسجيل الدخول</h1>
              </div>

              <div className="input-wrapper">
                <input
                  value={inputValue.email}
                  onChange={(e) =>
                    setInputValue({ ...inputValue, email: e.target.value })
                  }
                  type="email"
                  placeholder="البريد الإلكتروني"
                  required
                />
              </div>

              <div className="input-wrapper password-wrapper">
                <input
                  value={inputValue.password}
                  onChange={(e) =>
                    setInputValue({ ...inputValue, password: e.target.value })
                  }
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور"
                  required
                />
                <EyeIcon
                  visible={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="buttonform">
                <button className="LogInbutton" disabled={loading}>
                  {loading ? "جاري التسجيل..." : "دخول"}
                </button>
                <Link to="/">
                  <button className="Canselbutton" type="button">
                    إلغاء
                  </button>
                </Link>
              </div>

              <span className="spanOne">
                ليس لديك حساب؟
                <Link to="/SigIN">
                  <button className="SignUp" type="button">
                    إنشاء حساب
                  </button>
                </Link>
              </span>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loadingOverlay">
          <div className="spinner"></div>
        </div>
      )}
    </>
  );
}
