import { useContext, useEffect, useState } from "react";
import { OrderContext } from "../../useContexts/OrderContext";
import { UserContext } from "../../useContexts/UserContext";
import { useNavigate } from "react-router-dom";
import "./styleUserOrders.css";
import { FaBox, FaCalendarAlt, FaEye, FaCheckCircle } from "react-icons/fa";

export default function UserOrders() {
  const { orders, loading, fetchMyOrders, confirmDelivery, getOrderStatus } =
    useContext(OrderContext);
  const { isLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  //  دمج الـ useEffect في واحد فقط
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!isLoggedIn && !token) {
      navigate("/login");
      return;
    }

    //  جلب الطلبات فور تحميل الصفحة
    fetchMyOrders();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      fetchMyOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, navigate, fetchMyOrders]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleConfirmDelivery = async (orderId) => {
    const confirmed = await confirmDelivery(orderId);
    if (confirmed) {
      // يمكن إضافة أي إجراء إضافي بعد التأكيد
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>جاري تحميل طلباتك...</p>
      </div>
    );
  }

  return (
    <div className="user-orders-page">
      <div className="orders-header">
        <h1>
          <FaBox className="header-icon" />
          طلباتي
        </h1>

        <p>عرض جميع طلباتك السابقة والحالية</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <FaBox
            style={{ fontSize: "3rem", color: "#3498db", marginBottom: "20px" }}
          />
          <h3>لا توجد طلبات حتى الآن</h3>
          <p>عند قيامك بشراء منتجات، ستظهر طلباتك هنا</p>
          <button onClick={() => navigate("/")} className="shop-now-btn">
            تسوق الآن
          </button>
        </div>
      ) : (
        <div className="orders-container">
          {orders.map((order) => {
            const status = getOrderStatus(order.status);
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">
                    <span>#{order._id.slice(-8)} :رقم الطلب </span>
                  </div>
                  <div className="order-date">
                    <FaCalendarAlt />
                    <span>{formatDate(order.orderDate)}</span>
                  </div>
                </div>

                <div
                  className="order-status-bar"
                  style={{
                    backgroundColor: status.color + "20",
                    borderColor: status.color
                  }}
                >
                  <span className="status-text" style={{ color: status.color }}>
                    {status.text}
                  </span>
                  <span className="status-icon">{status.icon}</span>
                </div>

                <div className="order-items">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="order-item-mini">
                      <img
                        src={
                          item.productImage ||
                          item.productId?.images?.[0] ||
                          "/Images/default-product.jpg"
                        }
                        alt={item.productName}
                      />
                      <div className="item-mini-details">
                        <p className="item-name">{item.productName}</p>
                        <p className="item-meta">
                          <span>{item.color} :اللون </span>
                          <span>الكمية: {item.quantity}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="more-items">
                      +{order.items.length - 3} منتجات أخرى
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <strong>{order.totalAmount}</strong>
                    <span>: الإجمالي</span>
                  </div>

                  <div className="order-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => setSelectedOrderDetails(order)}
                    >
                      <FaEye /> التفاصيل
                    </button>

                    {/* {order.status !== "delivered" &&
                      order.status !== "cancelled" && (
                        <button
                          className="track-order-btn"
                          onClick={() => {
                            يمكن إضافة صفحة تتبع 
                          }}
                        >
                          <MdDeliveryDining /> تتبع
                        </button>
                      )} */}

                    {order.status === "shipped" &&
                      !order.deliveryConfirmedByUser && (
                        <button
                          className="confirm-delivery-btn"
                          onClick={() => handleConfirmDelivery(order._id)}
                        >
                          <FaCheckCircle /> تأكيد الاستلام
                        </button>
                      )}

                    {/* <a
                      href={`https://wa.me/+963982359538?text=${encodeURIComponent(order.whatsappMessage || `استفسار بخصوص الطلب #${order._id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-contact-btn"
                    >
                      <FaWhatsapp /> واتساب
                    </a> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for order details */}
      {selectedOrderDetails && (
        <div
          className="order-details-modal"
          onClick={() => setSelectedOrderDetails(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setSelectedOrderDetails(null)}
            >
              {/* #{selectedOrderDetails._id.slice(-8)} */}
            </button>
            <h2>تفاصيل الطلب </h2>

            <div className="order-info-grid">
              <div className="info-item">
                <label>تاريخ الطلب :</label>
                <span>{formatDate(selectedOrderDetails.orderDate)}</span>
              </div>
              <div className="info-item">
                <label>الحالة :</label>
                <span
                  style={{
                    color: getOrderStatus(selectedOrderDetails.status).color
                  }}
                >
                  {getOrderStatus(selectedOrderDetails.status).text}
                </span>
              </div>
              <div className="info-item">
                <label>الإجمالي :</label>
                <span>${selectedOrderDetails.totalAmount}</span>
              </div>
              {selectedOrderDetails.deliveredDate && (
                <div className="info-item">
                  <label>تاريخ التوصيل :</label>
                  <span>{formatDate(selectedOrderDetails.deliveredDate)}</span>
                </div>
              )}
            </div>

            <h3>المنتجات</h3>
            <div className="order-products-list">
              {selectedOrderDetails.items.map((item, idx) => (
                <div key={idx} className="order-product-item">
                  <img
                    src={
                      item.productImage ||
                      item.productId?.images?.[0] ||
                      "/Images/default-product.jpg"
                    }
                    alt={item.productName}
                  />
                  <div className="product-details-user-order">
                    <h4>{item.productName}</h4>
                    <p>{item.color}: اللون</p>
                    <p>{item.quantity}: الكمية</p>
                    <p> ${item.priceAtOrder}: السعر</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
