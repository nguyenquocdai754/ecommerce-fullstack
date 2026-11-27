import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cancelOrder, confirmOrderReceived, getManagedOrder, getMyOrders, getOrder } from "../services/orderService";
import api from "../services/api";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const statusLabels = { PENDING: "Chờ xác nhận", PENDING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", PREPARING: "Đang chuẩn bị", SHIPPING: "Đang giao", DELIVERED: "Đã giao", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy" };
const trackingStages = [
  { label: "Đặt hàng", statuses: ["PENDING", "PENDING_PAYMENT"] },
  { label: "Xác nhận", statuses: ["CONFIRMED"] },
  { label: "Chuẩn bị", statuses: ["PREPARING"] },
  { label: "Đang giao", statuses: ["SHIPPING"] },
  { label: "Đã giao", statuses: ["DELIVERED"] },
  { label: "Hoàn tất", statuses: ["COMPLETED"] },
];

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState("");
  useEffect(() => { getMyOrders().then(setOrders).catch(() => setError("Chưa tải được lịch sử đơn hàng.")); }, []);
  const visible = status === "ALL" ? orders : orders.filter((item) => item.status === status);

  return <main className="orders-page"><section className="orders-card"><Link to="/">← Trang chủ</Link><span className="eyebrow">TÀI KHOẢN CỦA BẠN</span><h1>Lịch sử mua hàng</h1>
    <label className="order-filter">Trạng thái <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">Tất cả</option>{Object.entries(statusLabels).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label>
    {error && <p role="alert">{error}</p>}
    {!error && visible.length === 0 ? <p>Bạn chưa có đơn hàng ở trạng thái này.</p> : <div className="orders-list">{visible.map((order) => <article className="order-row" key={order.id}><div><strong>Đơn hàng #{order.id}</strong><small>{new Date(order.created_at).toLocaleString("vi-VN")}</small><span>{order.first_book || "Đơn hàng sách"}</span></div><div><b>{money(order.total_amount)}</b><small>{statusLabels[order.status] || order.status} · {order.payment_method}</small><Link to={`/orders/${order.id}`}>Theo dõi đơn →</Link></div></article>)}</div>}
  </section></main>;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const role = (() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}").role || ""; } catch { return ""; }
  })();
  const loadOrder = role === "MANAGER" || role === "ADMIN" ? getManagedOrder : getOrder;
  useEffect(() => { loadOrder(id).then(setOrder).catch(() => setError("Không tìm thấy đơn hàng.")); }, [id, loadOrder]);
  const trackingIndex = trackingStages.findIndex((stage) => stage.statuses.includes(order?.status));
  const cancel = async () => {
    const reason = window.prompt("Lý do hủy đơn hàng:");
    if (reason === null) return;
    try { await cancelOrder(id, reason); setOrder(await getOrder(id)); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa thể hủy đơn hàng."); }
  };
  const confirmReceived = async () => {
    if (!window.confirm("Xác nhận bạn đã nhận đủ sách trong đơn hàng này?")) return;
    try { await confirmOrderReceived(id); setOrder(await getOrder(id)); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa xác nhận được đơn hàng."); }
  };
  if (error && !order) return <main className="orders-page"><section className="orders-card"><p role="alert">{error}</p><Link to="/orders">Về lịch sử đơn hàng</Link></section></main>;
  if (!order) return <main className="orders-page"><section className="orders-card">Đang tải đơn hàng…</section></main>;
  return <main className="orders-page"><section className="orders-card"><Link to={role === "CUSTOMER" ? "/orders" : "/management"}>← {role === "CUSTOMER" ? "Lịch sử đơn hàng" : "Dashboard quản lý"}</Link><span className="eyebrow">CHI TIẾT ĐƠN HÀNG</span><h1>Đơn hàng #{order.id}</h1><p>Trạng thái: <strong>{statusLabels[order.status] || order.status}</strong></p>
    {order.status === "CANCELLED" ? <div className="tracking-cancelled"><span aria-hidden="true">×</span><div><strong>Đơn hàng đã hủy</strong><small>{order.cancel_reason || "Đơn hàng này không còn được giao."}</small></div></div> : <section className="order-tracking" aria-label="Tiến độ giao hàng"><div className="order-tracking-heading"><div><span className="eyebrow">THEO DÕI ĐƠN HÀNG</span><h2>{statusLabels[order.status] || "Đang xử lý"}</h2></div><small>{trackingIndex >= 0 ? `${trackingIndex + 1} / ${trackingStages.length} mốc` : "Đang cập nhật"}</small></div><ol className="order-tracking-steps">{trackingStages.map((stage, index) => { const done = trackingIndex >= 0 && index < trackingIndex; const active = index === trackingIndex; const stageEvent = [...(order.history || [])].reverse().find((event) => stage.statuses.includes(event.status)); return <li className={`order-tracking-step${done ? " is-complete" : ""}${active ? " is-current" : ""}`} key={stage.label}><span className="order-tracking-marker">{done ? "✓" : index + 1}</span><div><strong>{stage.label}</strong>{stageEvent && <small>{new Date(stageEvent.created_at).toLocaleString("vi-VN")}</small>}</div></li>; })}</ol></section>}
    <div className="order-delivery-details"><p>Thanh toán: <strong>{order.payment_method} · {order.payment_status}</strong></p><p>Người nhận: <strong>{order.recipient_name} · {order.recipient_phone}</strong></p><p>Địa chỉ: <strong>{order.shipping_address}</strong></p><p>Vận chuyển: <strong>{order.shipping_method === "EXPRESS" ? "Giao nhanh" : "Tiêu chuẩn"} · {money(order.shipping_fee)}</strong></p></div>
    {order.cancel_reason && <p>Lý do hủy: {order.cancel_reason}</p>}<div className="orders-list">{order.items.map((item) => <div className="checkout-item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="checkout-total"><span>Phí vận chuyển</span><strong>{money(order.shipping_fee)}</strong></div><div className="checkout-total"><span>Tổng thanh toán</span><strong>{money(order.total_amount)}</strong></div>
    <h2>Lịch sử cập nhật</h2>{order.history?.length ? <ol className="order-timeline">{order.history.map((event, index) => <li key={`${event.status}-${event.created_at}-${index}`}><strong>{statusLabels[event.status] || event.status}</strong><small>{new Date(event.created_at).toLocaleString("vi-VN")}</small>{event.note && <span>{event.note}</span>}</li>)}</ol> : <p className="order-history-empty">Chưa có lịch sử cập nhật cho đơn hàng này.</p>}
    {error && <p role="alert">{error}</p>}{role === "CUSTOMER" && order.status === "PENDING_PAYMENT" && <Link className="checkout-submit retry-payment-link" to={`/payment-demo/${order.id}`}>Thanh toán lại</Link>}{role === "CUSTOMER" && order.status === "DELIVERED" && <button className="checkout-submit" type="button" onClick={confirmReceived}>Xác nhận đã nhận hàng</button>}{role === "CUSTOMER" && ["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(order.status) && <button className="outline-button" type="button" onClick={cancel}>Yêu cầu hủy đơn</button>}
  </section></main>;
}

export function PaymentDemoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const settle = async (result) => {
    setLoading(true); setError("");
    try {
      await api.post(`/payments/${id}/demo-result`, { result });
      navigate(`/orders/${id}`, { replace: true });
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || "Giao dịch chưa xử lý được."); }
    finally { setLoading(false); }
  };
  return <main className="checkout-page"><section className="checkout-card"><span className="eyebrow">CỔNG THANH TOÁN THỬ NGHIỆM</span><h1>Thanh toán đơn #{id}</h1><p>Đây là giao dịch mô phỏng cho môi trường đồ án, không thu tiền thật.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="payment-actions"><button disabled={loading} onClick={() => settle("SUCCESS")}>Mô phỏng thanh toán thành công</button><button className="outline-button" disabled={loading} onClick={() => settle("FAILED")}>Mô phỏng thất bại</button></div><button className="text-button" onClick={() => navigate("/orders")}>Để sau, xem đơn hàng</button></section></main>;
}
