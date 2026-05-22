// librarys
import { useContext, useEffect } from "react";
import { CartContext } from "../../useContexts/CartContext";
import axios from "axios";
import Swal from "sweetalert2";
import "./cart.css";
// Icone;
import { IoBagCheck } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { OrderContext } from "../../useContexts/OrderContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Cart() {
  const { cart, fetchCart } = useContext(CartContext);
  const token = localStorage.getItem("token");
  const { createOrder } = useContext(OrderContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    fetchCart();

    // الاستماع لأحداث تحديث السلة
    const handleCartUpdate = () => {
      fetchCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [fetchCart]);

  const deleteItem = async (itemId) => {
    await axios.delete(`${API_BASE_URL}/api/carts/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchCart();
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;

    await axios.put(
      `${API_BASE_URL}/api/carts/update-qty`,
      { itemId, quantity: newQty },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCart();
  };

  const totalPrice = cart.items.reduce((sum, item) => {
    const price =
      item.productId.discountPrice &&
      item.productId.discountPrice < item.productId.price
        ? item.productId.discountPrice
        : item.productId.price;

    return sum + price * item.quantity;
  }, 0);

  const buyAllFromCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "تسجيل الدخول مطلوب",
          text: "يجب تسجيل الدخول أولاً لإجراء هذه العملية"
        });
        return;
      }

      // التحقق من وجود منتجات في السلة
      if (!cart.items || cart.items.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "السلة فارغة",
          text: "لا توجد منتجات في السلة للشراء"
        });
        return;
      }

      // تأكيد الطلب
      const result = await Swal.fire({
        title: "تأكيد الطلب",
        text: "هل أنت متأكد من تأكيد الطلب؟",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "نعم، تأكيد",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true
      });

      if (result.isConfirmed) {
        // تحضير بيانات الطلب
        const orderItems = cart.items
          .map((item) => {
            if (!item.productId || !item.productId._id) {
              console.error("منتج بدون ID:", item);
              return null;
            }

            const price =
              item.productId.discountPrice &&
              item.productId.discountPrice < item.productId.price
                ? item.productId.discountPrice
                : item.productId.price;

            return {
              productId: item.productId._id,
              quantity: Number(item.quantity) || 1,
              color: item.color || "غير محدد",
              priceAtOrder: Number(price) || 0,
              productName: item.productId.name || "منتج",
              productImage:
                item.productId.images && item.productId.images[0]
                  ? item.productId.images[0]
                  : ""
            };
          })
          .filter((item) => item !== null);

        if (orderItems.length === 0) {
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "لا يمكن تحضير بيانات الطلب، تأكد من المنتجات"
          });
          return;
        }

        // تجهيز بيانات الطلب (بدون رابط واتساب)
        const orderData = {
          items: orderItems,
          totalAmount: Number(totalPrice) || 0,
          notes: "", // أو يمكنك إضافة حقل ملاحظات إذا أردت
          whatsappMessage: "", // لم نعد بحاجة لوضع رابط واتساب، لكن اتركه فارغاً لتفادي الأخطاء
          shippingAddress: {
            fullName: "",
            phone: "",
            address: "",
            city: ""
          }
        };

        console.log("📦 بيانات الطلب المرسلة:", orderData);

        const order = await createOrder(orderData);

        if (order) {
          // ✅ تم إنشاء الطلب بنجاح، عرض الخيارات
          Swal.fire({
            icon: "success",
            title: "تم إنشاء الطلب بنجاح",
            text: "يمكنك متابعة طلباتك أو مواصلة التسوق",
            showConfirmButton: true,
            confirmButtonText: "عرض طلباتي",
            showCancelButton: true,
            cancelButtonText: "متابعة التسوق",
            confirmButtonColor: "#667eea",
            cancelButtonColor: "#6c757d"
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/my-orders");
            } else {
              navigate("/");
            }
          });

          fetchCart(); // تحديث السلة
        }
      }
    } catch (err) {
      console.error("❌ خطأ في عملية الشراء:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء تنفيذ عملية الشراء"
      });
    }
  };

  if (!cart) return <h2>Loading...</h2>;

  return (
    <div className="Box BoxCart">
      <div className="continer continerCart">
        <div className="Text">
          <h3>سلة التسوق الخاصة بك</h3>
        </div>
        <div className="BoxMainCart">
          {cart.items.length === 0 && (
            <h2 style={{ color: "white", marginTop: "20px" }}>السلة فارغة</h2>
          )}
          {cart.items.map((item) => (
            <div
              key={item.productId._id + "-" + item.color}
              className="ProdictCart"
            >
              <div className="ProdectDetels">
                <div className="ProdictImg">
                  <img
                    src={item.productId.images[0]}
                    alt={item.productId.name}
                  />
                </div>
                <div className="ProdectNameAndPrice">
                  <div className="ProdectName">
                    <h4>{item.productId.name}</h4>
                    <p>color: {item.color}</p>
                  </div>
                  <div className="ProdectPrice">
                    {item.productId.discountPrice &&
                    item.productId.discountPrice < item.productId.price ? (
                      <>
                        <p style={{ color: "#0283fa", fontWeight: "bold" }}>
                          ${item.productId.discountPrice}
                        </p>
                        <p
                          style={{
                            textDecoration: "line-through",
                            color: "#777"
                          }}
                        >
                          ${item.productId.price}
                        </p>
                      </>
                    ) : (
                      <p style={{ color: "rgba(17, 17, 17, 0.849)" }}>
                        ${item.productId.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="quantityAndDeleteProdect">
                <div className="counter">
                  <button
                    onClick={() => updateQty(item._id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <p>{item.quantity}</p>
                  <button
                    onClick={() => updateQty(item._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="buttonDelete"
                  onClick={() => deleteItem(item._id)}
                >
                  {/* <RiDeleteBin6Fill /> */}
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          <div className="SumPriceProdectAndPuy">
            <div className="SumPriceProdect">
              <div>
                <h2>السعر الكلي: ${totalPrice}</h2>
              </div>
            </div>
            <div className="Puy">
              {cart.items.length > 0 ? (
                // ✅ زر نشط - السلة فيها منتجات
                <button onClick={buyAllFromCart} className="ButtonBuy">
                  <IoBagCheck /> متابعة الشراء
                </button>
              ) : (
                // 🚫 زر معطل - السلة فاضية
                <button
                  style={{
                    backgroundColor: "rgb(0, 150, 136, 0.5)",
                    cursor: "not-allowed",
                    opacity: 0.6
                  }}
                  className="ButtonBuy"
                  disabled
                  onClick={(e) => e.preventDefault()}
                >
                  <IoBagCheck /> متابعة الشراء
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
