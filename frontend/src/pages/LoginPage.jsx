import { useState } from "react";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await loginUser({ email, password });
      setMessage(`Đăng nhập thành công! Chào ${data.user?.full_name || "bạn"}`);
      // Sau này có thể chuyển hướng trang (ví dụ dùng useNavigate) ở đây
    } catch (err) {
      setError(err.message || "Email hoặc mật khẩu không chính xác!");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h2>Đăng Nhập Tài Khoản</h2>

      {message && (
        <div style={{ color: "green", marginBottom: "12px" }}>{message}</div>
      )}
      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        <div>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Nhập email của bạn..."
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Mật khẩu:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Nhập mật khẩu..."
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Đăng Nhập
        </button>
      </form>
    </div>
  );
}
