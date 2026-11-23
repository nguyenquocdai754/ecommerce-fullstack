import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // Nếu bạn đã tạo trang đăng ký
import CheckoutPage from "./pages/CheckoutPage";
import { OrderHistoryPage, OrderDetailPage, PaymentDemoPage } from "./pages/OrderHistoryPage";
import ManagementPage, { AdminUsersPage } from "./pages/ManagementPage";
import ReviewModerationPage from "./pages/ReviewModerationPage";
import ProfilePage from "./pages/ProfilePage";

const RequireRole = ({ roles, children }) => {
  const location = useLocation();
  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "null"); } catch { return null; }
  })();
  if (!sessionStorage.getItem("token")) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const CustomerOnly = ({ children }) => {
  return <RequireRole roles={["CUSTOMER"]}>{children}</RequireRole>;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Trang chủ Tiệm Sách An Nhiên hiển thị đầu tiên khi truy cập http://localhost:5173 */}
      <Route path="/" element={<HomePage />} />

      {/* Trang đăng nhập & đăng ký */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/checkout" element={<CustomerOnly><CheckoutPage /></CustomerOnly>} />
      <Route path="/orders" element={<CustomerOnly><OrderHistoryPage /></CustomerOnly>} />
      <Route path="/orders/:id" element={<CustomerOnly><OrderDetailPage /></CustomerOnly>} />
      <Route path="/profile" element={<CustomerOnly><ProfilePage /></CustomerOnly>} />
      <Route path="/payment-demo/:id" element={<CustomerOnly><PaymentDemoPage /></CustomerOnly>} />
      <Route path="/management" element={<RequireRole roles={["MANAGER", "ADMIN"]}><ManagementPage /></RequireRole>} />
      <Route path="/management/reviews" element={<RequireRole roles={["MANAGER", "ADMIN"]}><ReviewModerationPage /></RequireRole>} />
      <Route path="/management/orders/:id" element={<RequireRole roles={["MANAGER", "ADMIN"]}><OrderDetailPage /></RequireRole>} />
      <Route path="/admin/users" element={<RequireRole roles={["ADMIN"]}><AdminUsersPage /></RequireRole>} />
    </Routes>
  </BrowserRouter>
);

export default App;
