import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PasswordInput from "../components/PasswordInput";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "", avatar: "" });
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState({ recipient_name: "", phone: "", address: "", note: "", is_default: false });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => { const [me, saved] = await Promise.all([api.get("/users/me"), api.get("/users/me/addresses")]); setProfile(me.data.data); setAddresses(saved.data.data); };
  useEffect(() => { const timer = window.setTimeout(() => { void refresh().catch((requestError) => setError(requestError.response?.data?.message || "Chưa tải được hồ sơ.")); }, 0); return () => window.clearTimeout(timer); }, []);
  const saveProfile = async (event) => { event.preventDefault(); setError(""); setMessage(""); try { const { data } = await api.put("/users/me", { full_name: profile.full_name, phone: profile.phone || null, avatar: profile.avatar || null }); setProfile(data.data); setMessage("Đã cập nhật hồ sơ."); let user = {}; try { user = JSON.parse(sessionStorage.getItem("user") || "{}"); } catch { user = {}; } sessionStorage.setItem("user", JSON.stringify({ ...user, full_name: data.data.full_name, phone: data.data.phone, avatar: data.data.avatar })); } catch (requestError) { setError(requestError.response?.data?.message || "Chưa cập nhật được hồ sơ."); } };
  const saveAddress = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      if (editingAddressId) await api.put(`/users/me/addresses/${editingAddressId}`, address);
      else await api.post("/users/me/addresses", address);
      setAddress({ recipient_name: "", phone: "", address: "", note: "", is_default: false });
      setEditingAddressId(null); await refresh(); setMessage("Đã lưu địa chỉ.");
    } catch (requestError) { setError(requestError.response?.data?.message || "Chưa lưu được địa chỉ."); }
  };
  const editAddress = (item) => {
    setEditingAddressId(item.id);
    setAddress({ recipient_name: item.recipient_name, phone: item.phone, address: item.address, note: item.note || "", is_default: Boolean(item.is_default) });
  };
  const setDefaultAddress = async (item) => {
    setError("");
    try {
      await api.put(`/users/me/addresses/${item.id}`, { recipient_name: item.recipient_name, phone: item.phone, address: item.address, note: item.note || "", is_default: true });
      await refresh(); setMessage("Đã đặt làm địa chỉ mặc định.");
    } catch (requestError) { setError(requestError.response?.data?.message || "Chưa cập nhật được địa chỉ."); }
  };
  const removeAddress = async (id) => {
    if (!window.confirm("Xóa địa chỉ giao hàng này?")) return;
    try { await api.delete(`/users/me/addresses/${id}`); await refresh(); setMessage("Đã xóa địa chỉ."); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa xóa được địa chỉ."); }
  };
  const changePassword = async (event) => { event.preventDefault(); try { await api.put("/users/me/password", password); setPassword({ currentPassword: "", newPassword: "" }); setMessage("Đã đổi mật khẩu."); } catch (requestError) { setError(requestError.response?.data?.message || "Chưa đổi được mật khẩu."); } };
  return <main className="management-page"><header className="management-header"><Link to="/">← Trang chủ</Link><Link to="/orders">Lịch sử đơn hàng</Link></header><section className="management-content"><span className="eyebrow">TÀI KHOẢN CỦA BẠN</span><h1>Hồ sơ cá nhân</h1>{message && <p className="management-notice" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
    <section className="management-section"><h2>Thông tin cá nhân</h2><form className="management-form" onSubmit={saveProfile}>{profile.avatar && <img className="profile-avatar-preview" src={profile.avatar} alt="Ảnh đại diện" />}<input required maxLength="100" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Họ và tên" /><input type="email" disabled value={profile.email} /><input inputMode="tel" pattern="\+?[0-9]{10,15}" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Số điện thoại" /><input type="url" maxLength="255" value={profile.avatar || ""} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="URL ảnh đại diện (https://...)" /><button>Lưu hồ sơ</button></form></section>
    <section className="management-section"><h2>Địa chỉ giao hàng</h2>{addresses.map((item) => <article className="address-row" key={item.id}><div><strong>{item.recipient_name} · {item.phone}</strong>{Boolean(item.is_default) && <span className="default-address-badge">Địa chỉ mặc định</span>}<p>{item.address}</p>{item.note && <small>{item.note}</small>}</div><div className="address-actions"><button type="button" className="outline-button" onClick={() => editAddress(item)}>Sửa</button>{!item.is_default && <button type="button" className="outline-button" onClick={() => setDefaultAddress(item)}>Đặt mặc định</button>}<button type="button" className="outline-button" onClick={() => removeAddress(item.id)}>Xóa</button></div></article>)}<form className="management-form" onSubmit={saveAddress}><h3>{editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}</h3><input required maxLength="120" placeholder="Tên người nhận" value={address.recipient_name} onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })} /><input required inputMode="tel" pattern="\+?[0-9]{10,15}" placeholder="Số điện thoại" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /><input required maxLength="2000" placeholder="Địa chỉ chi tiết" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} /><input maxLength="500" placeholder="Ghi chú" value={address.note} onChange={(e) => setAddress({ ...address, note: e.target.value })} /><label className="checkbox-label"><input type="checkbox" checked={address.is_default} onChange={(e) => setAddress({ ...address, is_default: e.target.checked })} /> Đặt làm địa chỉ mặc định</label><div className="address-actions"><button>{editingAddressId ? "Lưu thay đổi" : "Lưu địa chỉ"}</button>{editingAddressId && <button type="button" className="outline-button" onClick={() => { setEditingAddressId(null); setAddress({ recipient_name: "", phone: "", address: "", note: "", is_default: false }); }}>Hủy sửa</button>}</div></form></section>
    <section className="management-section"><h2>Đổi mật khẩu</h2><form className="management-form" onSubmit={changePassword}><PasswordInput className="management-password-field" required placeholder="Mật khẩu hiện tại" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /><PasswordInput className="management-password-field" required minLength="8" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /><button>Đổi mật khẩu</button></form></section>
  </section></main>;
}
