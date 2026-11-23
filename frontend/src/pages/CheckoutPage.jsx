import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService";
import api from "../services/api";

const CART_KEY = "an-nhien-cart";
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const readCart = () => {
  try { const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(stored) ? stored : []; }
  catch { return []; }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart);
  const [form, setForm] = useState({ recipient: "", phone: "", address: "", note: "", paymentMethod: "COD", shippingMethod: "STANDARD" });
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.sale_price) * Number(item.quantity), 0), [cart]);
  const shippingFee = form.shippingMethod === "EXPRESS" ? 45000 : total >= 150000 ? 0 : 25000;

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      let user = {};
      try { user = JSON.parse(sessionStorage.getItem("user") || "{}"); } catch { user = {}; }
      const addresses = await api.get("/users/me/addresses").catch(() => null);
      if (!active) return;
      const saved = addresses?.data?.data || [];
      setSavedAddresses(saved);
      const preferred = saved.find((item) => item.is_default) || saved[0];
      setForm((current) => ({ ...current, recipient: preferred?.recipient_name || user.full_name || "", phone: preferred?.phone || user.phone || "", address: preferred?.address || "" }));
    };
    loadAccount();
    return () => { active = false; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const order = await createOrder({ ...form, items: cart.map(({ id, quantity }) => ({ id, quantity })) });
      localStorage.removeItem(CART_KEY);
      setCart([]);
      if (form.paymentMethod === "ONLINE") {
        navigate(`/payment-demo/${order.id}`, { replace: true });
        return;
      }
      navigate(`/orders/${order.id}`, { replace: true, state: { created: true } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Chưa thể tạo đơn hàng. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) return <main className="checkout-page"><section className="checkout-card"><h1>Giỏ hàng đang trống</h1><Link to="/">Quay lại chọn sách</Link></section></main>;

  return (
    <main className="checkout-page">
      <section className="checkout-card">
        <Link to="/">← Tiếp tục mua sách</Link>
        <span className="eyebrow">AN NHIÊN BOOKS</span>
        <h1>Thông tin thanh toán</h1>
        <div className="checkout-items">
          {cart.map((item) => <div className="checkout-item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money(item.sale_price * item.quantity)}</strong></div>)}
        </div>
        <div className="checkout-total"><span>Tạm tính</span><strong>{money(total)}</strong></div>
        <div className="checkout-total"><span>Phí vận chuyển dự kiến</span><strong>{shippingFee ? money(shippingFee) : "Miễn phí"}</strong></div>
        <div className="checkout-total"><span>Tổng thanh toán dự kiến</span><strong>{money(total + shippingFee)}</strong></div>
        <p className="checkout-note">Phí tiêu chuẩn 25.000đ, miễn phí từ 150.000đ; giao nhanh 45.000đ. Backend sẽ tính lại khi đặt hàng.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form className="checkout-form" onSubmit={submit}>
          {savedAddresses.length > 0 && <label>Địa chỉ đã lưu<select value="" onChange={(e) => { const selected = savedAddresses.find((item) => String(item.id) === e.target.value); if (selected) setForm({ ...form, recipient: selected.recipient_name, phone: selected.phone, address: selected.address, note: selected.note || form.note }); }}><option value="">Nhập địa chỉ khác</option>{savedAddresses.map((item) => <option value={item.id} key={item.id}>{item.recipient_name} · {item.address}</option>)}</select></label>}
          <label>Tên người nhận<input required maxLength="120" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} /></label>
          <label>Số điện thoại<input required inputMode="tel" pattern="\+?[0-9]{10,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Địa chỉ giao hàng<textarea required rows="3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label>Ghi chú đơn hàng<textarea rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <label>Phương thức vận chuyển<select value={form.shippingMethod} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}><option value="STANDARD">Tiêu chuẩn (2–4 ngày)</option><option value="EXPRESS">Giao nhanh (1–2 ngày)</option></select></label>
          <label>Phương thức thanh toán<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option value="COD">Thanh toán khi nhận hàng (COD)</option><option value="ONLINE">Thanh toán trực tuyến mô phỏng</option></select></label>
          <button className="checkout-submit" disabled={loading}>{loading ? "Đang tạo đơn…" : `Đặt hàng · ${money(total)}`}</button>
        </form>
      </section>
    </main>
  );
}
