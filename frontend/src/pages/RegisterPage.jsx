import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/authService";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) {
      setError("Số điện thoại phải có từ 10 đến 15 chữ số.");
      return;
    }
    if (formData.password.length < 8 || new TextEncoder().encode(formData.password).length > 72) {
      setError("Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);

    try {
      await registerUser({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      setSuccess(
        "Đăng ký tài khoản thành công! Bạn có thể chuyển sang đăng nhập.",
      );
      setFormData({ full_name: "", email: "", password: "", confirmPassword: "", phone: "" });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";
      setError(message);
    } finally {
      setLoading(false);
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
        fontFamily: "sans-serif",
      }}
    >
      <Link to="/" style={{ color: "#526b55", textDecoration: "none" }}>← Về trang chủ</Link>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Đăng Ký Tài Khoản
      </h2>

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
            Họ và tên:
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            maxLength={100}
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
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@gmail.com"
            maxLength={255}
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

        <div style={{ marginBottom: "15px" }}>
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ít nhất 8 ký tự"
            minLength={8}
            maxLength={72}
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

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
            Xác nhận mật khẩu:
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
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
            Số điện thoại:
          </label>
          <input
            type="text"
            name="phone"
            inputMode="tel"
            pattern="\+?[0-9]{10,15}"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0912345678 (10 số)"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <small style={{ display: "block", color: "#68736a", marginTop: "5px" }}>Nhập 10–15 chữ số, ví dụ: 0912345678.</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#999" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "15px",
          }}
        >
          {loading ? "Đang xử lý..." : "Đăng Ký"}
        </button>
      </form>

      <div style={{ textAlign: "center", fontSize: "14px" }}>
        Đã có tài khoản?{" "}
        <Link to="/login" style={{ color: "#3b4d3c", fontWeight: 600 }}>
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
