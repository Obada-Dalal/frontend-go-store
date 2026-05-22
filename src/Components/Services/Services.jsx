// librarys
import "./services.css";
// Icone
import { LuTruck } from "react-icons/lu";
import { AiOutlineSafety } from "react-icons/ai";
import { FaRecycle } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";

export default function Services() {
  return (
    <div id="services" className="services">
      <h1>لماذا تختارنا؟</h1>
      <div className="box-servs">
        <div className="serv">
          <i>
            <LuTruck className="truck" />
          </i>
          <h2>شحن مجاني</h2>
          <p>على الطلبات فوق 100$ في المحافظات .</p>
        </div>
        <div className="serv">
          <i>
            <AiOutlineSafety className="safety" />
          </i>
          <h2>عروض أسبوعية حصرية</h2>
          <p>تابعونا للاطلاع على أحدث التخفيضات والعروض المميزة.</p>
        </div>
        <div className="serv">
          <i>
            <FaRecycle className="recyle" />
          </i>
          <h2>أحدث الابتكارات التقنية</h2>
          <p>
            نواكب أحدث التطورات في عالم الإكسسوارات لنقدم لكم الأفضل دائماً.
          </p>
        </div>
        <div className="serv">
          <i>
            <BiSupport className="support" />
          </i>
          <h2>24/7 دعم </h2>
          <p>خدمة زبائن أونلاين 24/7</p>
        </div>
      </div>
    </div>
  );
}
