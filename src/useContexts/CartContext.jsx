import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ استخدم useCallback لتثبيت الدالة
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCart({ items: [] });
      setIsLoggedIn(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/carts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCart(res.data || { items: [] });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart({ items: [] });
      setIsLoggedIn(false);
    }
  }, []); // ← dependencies فاضية لأنها لا تعتمد على شيء

  const refreshCart = useCallback(() => {
    fetchCart();
  }, [fetchCart]);

  // ملف CartContext.jsx

  // قم بتغيير توقيع الدالة لإضافة quantity بقيمة افتراضية (1) في حال لم يتم تمريرها
  const addToCart = useCallback(
    async (productId, color = null, quantity = 1) => {
      // <--- أضف المعامل quantity هنا
      const token = localStorage.getItem("token");

      if (!token) {
        await Swal.fire({
          icon: "info",
          title: "تسجيل الدخول مطلوب",
          text: "يجب تسجيل الدخول لإضافة المنتج إلى السلة",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#3085d6"
        });
        return false;
      }

      try {
        await axios.post(
          `${API_BASE_URL}/api/carts`,
          {
            productId,
            quantity: quantity, // <--- استخدم الـ quantity الذي تم تمريره هنا بدلاً من 1
            color
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        await fetchCart(); // تحديث السلة بعد الإضافة
        return true;
      } catch (error) {
        console.error("Error adding to cart:", error);
        await Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "حدث خطأ أثناء إضافة المنتج إلى السلة",
          confirmButtonText: "حسناً"
        });
        return false;
      }
    },
    [fetchCart]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();

    const handleStorageChange = (e) => {
      if (e.key === "token") {
        fetchCart();
        setIsLoggedIn(!!e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchCart]); // ← الآن fetchCart ثابتة، مش هتتغير

  const cartCount = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const removeItemsFromCart = async (itemsToRemove) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // جلب السلة الحالية
      const cartResponse = await axios.get(`${API_BASE_URL}/api/carts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const currentCart = cartResponse.data;
      if (!currentCart || !currentCart.items) return;

      // حذف كل عنصر من العناصر المطلوب حذفها
      for (const itemToRemove of itemsToRemove) {
        // البحث عن العنصر في السلة
        const cartItem = currentCart.items.find(
          (item) =>
            item.productId?._id?.toString() ===
              itemToRemove.productId?.toString() &&
            item.color === itemToRemove.color
        );

        if (cartItem) {
          await axios.delete(`${API_BASE_URL}/api/carts/${cartItem._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // تحديث السلة
      await fetchCart();
    } catch (error) {
      console.error("❌ خطأ في حذف عناصر من السلة:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        fetchCart,
        cartCount,
        refreshCart,
        isLoggedIn,
        removeItemsFromCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
