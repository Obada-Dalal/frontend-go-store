import React, { useState, useEffect, useRef } from "react";
import "./contact.css";
import { useForm, ValidationError } from "@formspree/react";
import Lottie from "lottie-react";
import Swal from "sweetalert2";

// استيراد ملفات Lottie
import contactAnimation from "../../../public/animation/Contact us.json";
import successAnimation from "../../../public/animation/Success.json";

// استيراد الأيقونات من React Icons
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker
} from "react-icons/hi";

export default function Contact() {
  // استخدام Hook Formspree
  const [state, handleSubmit] = useForm("mqargbpw");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successKey, setSuccessKey] = useState(0);

  // نتتبع الانتقال من submitting=true إلى submitting=false
  const wasSubmitting = useRef(false);

  useEffect(() => {
    const finishedSubmitting = wasSubmitting.current && !state.submitting;

    if (finishedSubmitting) {
      const succeededNow =
        state.succeeded && (!state.errors || state.errors.length === 0);

      if (succeededNow) {
        // تفريغ الحقول
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({ name: "", email: "", message: "" });

        // إظهار رسالة النجاح
        setShowSuccess(true);
        setSuccessKey((k) => k + 1);

        // إظهار SweetAlert أيضاً
        Swal.fire({
          icon: "success",
          title: "تم الإرسال بنجاح",
          text: "شكراً لتواصلك معنا، سنرد عليك قريباً",
          timer: 3000,
          showConfirmButton: false
        });

        // إخفاء الرسالة بعد 4 ثوانٍ
        const timer = setTimeout(() => {
          setShowSuccess(false);
        }, 4000);

        return () => clearTimeout(timer);
      }
    }

    wasSubmitting.current = state.submitting;
  }, [state.submitting, state.succeeded, state.errors]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="box">
      <div className="container">
        <h1 id="Contact" data-aos="fade-up">
          Contact
        </h1>
        <div className="contact">
          <div className="social" data-aos="fade-right">
            <div className="content">
              <h3>للتواصل</h3>

              {/* Phone */}
              <div className="box-content">
                <div className="icon phone">
                  <FiPhone className="react-icon" />
                  <HiOutlinePhone className="react-icon" />
                </div>
                <div className="text">
                  <p>Phone</p>
                  <p>+963 947 584 270</p>
                  <p>+963 982 359 538</p>
                </div>
              </div>

              {/* Email */}
              <div className="box-content">
                <div className="icon email">
                  <FiMail className="react-icon" />
                  <HiOutlineMail className="react-icon" />
                </div>
                <div className="text">
                  <p>Email</p>
                  <p>obadaeiddalal@gmail.com</p>
                  <p>omaralshalak@gmail.com</p>
                </div>
              </div>

              {/* Location */}
              <div className="box-content">
                <div className="icon location">
                  <FiMapPin className="react-icon" />
                  <HiOutlineLocationMarker className="react-icon" />
                </div>
                <div className="text">
                  <p>Location</p>
                  <p>Syria</p>
                </div>
              </div>
            </div>

            {/* Lottie Animation */}
            <div className="contact-animation">
              <Lottie
                animationData={contactAnimation}
                loop={true}
                className="lottie-player"
                style={{ width: "100%", height: "300px" }}
              />
              <p className="animation-text">تواصل معنا ... نحن هنا لمساعدتك</p>
            </div>
          </div>

          <div className="form" data-aos="fade-left">
            <h3>ارسال رسالة </h3>

            <form onSubmit={handleSubmit}>
              <label htmlFor="name">الاسم الكامل </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <ValidationError
                prefix="Name"
                field="name"
                errors={state.errors}
              />

              <label htmlFor="email">البريد الالكتروني </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <ValidationError
                prefix="Email"
                field="email"
                errors={state.errors}
              />

              <label htmlFor="message">نص الرسالة </label>
              <textarea
                rows="5"
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
              <ValidationError
                prefix="Message"
                field="message"
                errors={state.errors}
              />

              <div className="button">
                <button type="submit" disabled={state.submitting}>
                  <FiMail style={{ marginLeft: "10px" }} className="btn-icon" />
                  {state.submitting ? "جاري الإرسال..." : "إرسال الرسالة"}
                </button>
              </div>

              {/* رسالة النجاح مع Lottie */}
              {showSuccess && (
                <div key={successKey} className="success-message">
                  <Lottie
                    loop={false}
                    animationData={successAnimation}
                    style={{ width: "37px", height: "37px" }}
                  />
                  <p>Your message has been sent successfully 👍</p>
                </div>
              )}
            </form>

            {state.errors && state.errors.length > 0 && (
              <p style={{ color: "red", marginTop: "8px" }}>
                Failed to send. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
