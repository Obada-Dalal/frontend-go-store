import "./App.css";
import { useState, useEffect } from "react";
import Home from "./Components/Home/Home";
import LogIN from "./Components/LogInAndSigIn/LogIn/LogIn";
import SigIN from "./Components/LogInAndSigIn/SignIn/SignIn";
import Products from "./Components/Products/Products";
import ProductDetails from "./Components/ProductDetails/ProductDetails";
import { UserProvider } from "./useContexts/UserContext";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  ScrollRestoration
} from "react-router-dom";
import Cart from "./Components/Cart/Cart";
import Search from "./Components/Search/Search";
import Dashboard from "./Components/Dashboard/Dashboard";
import ProductList from "./Components/Dashboard/productList/ProductList";
import EditProduct from "./Components/Dashboard/EditProduct/EditProduct";
import AddProduct from "./Components/Dashboard/addproduct/AddProduct";
import UsersManagement from "./Components/Dashboard/UsersManagement/UsersManagement";
import AdvertisementsList from "./Components/Dashboard/AdvertisementsList/AdvertisementsList";
import AddAdvertisement from "./Components/Dashboard/AdvertisementsList/AddAdvertisement";
import EditAdvertisement from "./Components/Dashboard/AdvertisementsList/EditAdvertisement";
import UserOrders from "./Components/UserOrder/UserOrders";
import OrdersManagemen from "./Components/Dashboard/OrdersManagemen/OrdersManagemen";
import DiscountsPage from "./Components/Discounts/DiscountsPage";


function App() {
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollBtn(window.scrollY > 300);
    };

    // التحقق عند تحميل الصفحة
    handleScroll();

    // إضافة مستمع الحدث
    window.addEventListener("scroll", handleScroll);

    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <UserProvider>
        <Router>
          <ScrollRestoration />
          <Routes>
            {/* المسارات الرئيسية */}
            <Route path="/" element={<Home />}>
              <Route path="/" element={<Products />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<Products />} />
            </Route>

            <Route path="/product/:id" element={<ProductDetails />} />

            {/* مسارات Dashboard */}
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<ProductList />} />
              <Route path="productsList" element={<ProductList />} />
              <Route path="addProduct" element={<AddProduct />} />
              <Route path="EditProduct/:id" element={<EditProduct />} />
              <Route path="/dashboard/users" element={<UsersManagement />} />
              <Route path="/dashboard/orders" element={<OrdersManagemen />} />
              <Route path="advertisements" element={<AdvertisementsList />} />
              <Route path="advertisements/add" element={<AddAdvertisement />} />
              <Route
                path="advertisements/edit/:id"
                element={<EditAdvertisement />}
              />
            </Route>

            {/* مسارات أخرى */}
            <Route path="/logIn" element={<LogIN />} />
            <Route path="/SigIN" element={<SigIN />} />
            <Route path="/Cart" element={<Cart />} />
            <Route path="/search" element={<Search />} />
            <Route path="/my-orders" element={<UserOrders />} />
            <Route path="/discounts" element={<DiscountsPage />} />
          </Routes>
        </Router>
      </UserProvider>

      {/* ✅ زر العودة للأعلى - باستخدام state الصحيح */}
      <button
        className={`scroll-to-top ${showScrollBtn ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>
    </>
  );
}

export default App;
