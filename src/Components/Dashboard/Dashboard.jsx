import "./styleDashboard.css";
import { NavLink, Outlet } from "react-router-dom";
// icon
import { FaBullhorn } from "react-icons/fa";
import { RiFolderAddFill } from "react-icons/ri";
import { FaRectangleList } from "react-icons/fa6";
import { FaUsersGear } from "react-icons/fa6";
import { FaBox } from "react-icons/fa";
// import ProductList from "./productList/ProductList";

export default function Dashboard() {
  return (
    <div className="page-dashboard">
      <div className="sidebar">
        <div className="Logo">
          <img src="../../../public/Images/SVGLogo.svg" alt="Logo" />
        </div>
        <ul>
          <li>
            <NavLink
              to="/dashboard/productsList"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <FaRectangleList /> <span> product List </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/users"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <FaUsersGear /> <span>Users </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/advertisements"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <FaBullhorn />
              <span>advertisements</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/orders"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <FaBox />
              <span>OrdersManagement</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="content-dashboard">
        <Outlet />
      </div>
    </div>
  );
}
