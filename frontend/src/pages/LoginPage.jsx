import { useState } from "react";
import { loginUser } from "../services/authService";

const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      const resultData = response.data || response;

      const token = resultData.data?.accessToken || resultData.accessToken;
      const user = resultData.data?.user || resultData.user;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      setSuccess("Đăng nhập thành công!");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Đăng Nhập</h2>

      {error && (
        <div
          style={{
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "#e6ffe6",
            color: "#006600",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "bold",
            }}
          >
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer01@example.com"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "bold",
            }}
          >
            Mật khẩu:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Demo@123"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#999" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "15px",
          }}
        >
          {loading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>

      <div style={{ textAlign: "center", fontSize: "14px" }}>
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
            fontSize: "14px",
          }}
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
