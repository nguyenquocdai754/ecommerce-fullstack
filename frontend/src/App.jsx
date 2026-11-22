import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // Nếu bạn đã tạo trang đăng ký

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Trang chủ Tiệm Sách An Nhiên hiển thị đầu tiên khi truy cập http://localhost:5173 */}
      <Route path="/" element={<HomePage />} />

      {/* Trang đăng nhập & đăng ký */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
