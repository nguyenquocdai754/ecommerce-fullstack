import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import PasswordInput from "../components/PasswordInput";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(formData);
      const { accessToken, expiresIn, user } = result.data;
      const username =
        user.full_name ||
        user.fullName ||
        user.username ||
        user.email?.split("@")[0] ||
        "Độc giả";

      sessionStorage.setItem("token", accessToken);
      sessionStorage.setItem(
        "expiresAt",
        String(Date.now() + expiresIn * 1000),
      );
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("username", username);
      const roleHome = user.role === "ADMIN" || user.role === "MANAGER" ? "/management" : "/";
      navigate(location.state?.from || roleHome, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Kiểm tra kết nối máy chủ và thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        backgroundColor: "#f9f8f6",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          border: "1px solid #e5e2dc",
          borderRadius: "12px",
          boxShadow: "0 12px 36px rgba(47, 62, 48, 0.08)",
        }}
      >
        <Link to="/" style={{ color: "#526b55", textDecoration: "none" }}>
          ← Về trang chủ
        </Link>
        <h1 style={{ color: "#2f3e30", margin: "24px 0 8px" }}>Đăng nhập</h1>
        <p style={{ color: "#68736a", margin: "0 0 24px" }}>
          Đăng nhập tài khoản Tiệm Sách An Nhiên của bạn.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px",
              marginBottom: "18px",
              color: "#9b1c1c",
              backgroundColor: "#fff0f0",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="ban@example.com"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #cbd2cb",
              borderRadius: "6px",
            }}
          />

          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
          >
            Mật khẩu
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: 0,
              border: "1px solid #cbd2cb",
              borderRadius: "6px",
            }}
            wrapperStyle={{ marginBottom: 22 }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              color: "#fff",
              backgroundColor: loading ? "#89968b" : "#3b4d3c",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "wait" : "pointer",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p
          style={{ margin: "22px 0 0", textAlign: "center", color: "#68736a" }}
        >
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ color: "#3b4d3c", fontWeight: 600 }}>
            Đăng ký
          </Link>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
