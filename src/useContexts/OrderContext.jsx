import { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useContext } from "react";
import { CartContext } from "./CartContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// eslint-disable-next-line react-refresh/only-export-components
export const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { removeItemsFromCart } = useContext(CartContext);

  // ✅ تعريف fetchMyOrders أولاً
  const fetchMyOrders = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = Array.isArray(response.data)
        ? response.data
        : response.data.orders || [];

      setOrders(ordersData);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);

      if (error.response?.status === 401) {
        console.log("⚠️ Unauthorized, clearing orders");
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchMyOrders();
    }

    // ✅ الحل: مراقبة تغيير التوكن يدوياً كل 500 مللي ثانية
    let lastToken = token;
    const checkInterval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== lastToken) {
        lastToken = currentToken;
        if (currentToken) {
          fetchMyOrders();
        } else {
          setOrders([]);
        }
      }
    }, 500); // فحص كل نصف ثانية

    // ✅ الاستماع للـ storage event للتبويبات الأخرى
    const handleStorageChange = (e) => {
      if (e.key === "token" && e.newValue) {
        fetchMyOrders();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchMyOrders]);

  const createOrder = async (orderData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "تسجيل الدخول مطلوب",
        text: "يجب تسجيل الدخول أولاً لإتمام الطلب"
      });
      return null;
    }

    try {
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("السلة فارغة");
      }

      const cleanItems = orderData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        color: item.color || "غير محدد",
        priceAtOrder: Number(item.priceAtOrder) || 0,
        productName: item.productName || "منتج",
        productImage: item.productImage || ""
      }));

      const cleanOrderData = {
        items: cleanItems,
        totalAmount: Number(orderData.totalAmount) || 0,
        notes: orderData.notes || "",
        whatsappMessage: orderData.whatsappMessage || "",
        shippingAddress: orderData.shippingAddress || {
          fullName: "",
          phone: "",
          address: "",
          city: ""
        }
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/orders`,
        cleanOrderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      await fetchMyOrders();

      Swal.fire({
        icon: "success",
        title: "تم إنشاء الطلب",
        text: "تم إنشاء الطلب بنجاح",
        timer: 2000,
        showConfirmButton: false
      });

      return response.data.order;
    } catch (error) {
      console.error("❌ خطأ في إنشاء الطلب:", error);

      let errorMessage = "حدث خطأ أثناء إنشاء الطلب";

      if (error.response) {
        console.error("رد السيرفر:", error.response.data);
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          errorMessage;
      } else if (error.request) {
        errorMessage = "لا يمكن الاتصال بالسيرفر";
      } else {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: errorMessage
      });
      return null;
    }
  };

  const confirmDelivery = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const result = await Swal.fire({
        title: "تأكيد استلام الطلب",
        text: "هل أنت متأكد من استلامك لهذا الطلب؟",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "نعم، تم الاستلام",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#d33"
      });

      if (result.isConfirmed) {
        const response = await axios.put(
          `${API_BASE_URL}/api/orders/${orderId}/confirm-delivery`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.order && response.data.order.items) {
          const itemsToRemove = response.data.order.items.map((item) => ({
            productId: item.productId,
            color: item.color
          }));
          await removeItemsFromCart(itemsToRemove);
        }

        await fetchMyOrders();

        Swal.fire({
          icon: "success",
          title: "تم التأكيد",
          text: "شكراً لتأكيد استلام الطلب",
          timer: 2000,
          showConfirmButton: false
        });

        return true;
      }
    } catch (error) {
      console.error("Error confirming delivery:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error.response?.data?.error || "حدث خطأ أثناء تأكيد الاستلام"
      });
    }
    return false;
  };

  // eslint-disable-next-line no-unused-vars
  const removeOrderItemsFromCart = async (orderItems) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const cartResponse = await axios.get(`${API_BASE_URL}/api/carts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const currentCart = cartResponse.data;
      if (!currentCart || !currentCart.items) return;

      const itemsToKeep = currentCart.items.filter((cartItem) => {
        const isInOrder = orderItems.some(
          (orderItem) =>
            orderItem.productId?.toString() ===
              cartItem.productId?._id?.toString() &&
            orderItem.color === cartItem.color
        );
        return !isInOrder;
      });

      if (itemsToKeep.length !== currentCart.items.length) {
        for (const cartItem of currentCart.items) {
          const isInOrder = orderItems.some(
            (orderItem) =>
              orderItem.productId?.toString() ===
                cartItem.productId?._id?.toString() &&
              orderItem.color === cartItem.color
          );

          if (isInOrder) {
            await axios.delete(`${API_BASE_URL}/api/carts/${cartItem._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }

        if (window.location.pathname === "/cart") {
          window.dispatchEvent(new Event("cart-updated"));
        }
      }
    } catch (error) {
      console.error(" خطأ في حذف المنتجات من السلة:", error);
    }
  };

  const refreshOrders = useCallback(async () => {
    await fetchMyOrders();
  }, [fetchMyOrders]);

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: {
        text: "قيد الانتظار",
        color: "#f5a623",
        icon: "⏳",
        bgColor: "rgba(245, 166, 35, 0.1)"
      },
      confirmed: {
        text: "تم التأكيد",
        color: "#10b981",
        icon: "✅",
        bgColor: "rgba(16, 185, 129, 0.1)"
      },
      processing: {
        text: "قيد التجهيز",
        color: "#5f8fa9",
        icon: "⚙️",
        bgColor: "rgba(95, 143, 169, 0.1)"
      },
      shipped: {
        text: "تم الشحن",
        color: "#06b6d4",
        icon: "🚚",
        bgColor: "rgba(6, 182, 212, 0.1)"
      },
      delivered: {
        text: "تم التوصيل",
        color: "#059669",
        icon: "🏠",
        bgColor: "rgba(5, 150, 105, 0.1)"
      },
      cancelled: {
        text: "ملغي",
        color: "#ef4444",
        icon: "❌",
        bgColor: "rgba(239, 68, 68, 0.1)"
      }
    };
    return (
      statusMap[status] || {
        text: status,
        color: "#64748b",
        icon: "📦",
        bgColor: "rgba(100, 116, 139, 0.1)"
      }
    );
  };

  const value = {
    orders,
    loading,
    selectedOrder,
    setSelectedOrder,
    orderCount: orders.length,
    refreshOrders,
    fetchMyOrders,
    createOrder,
    confirmDelivery,
    getOrderStatus
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}
