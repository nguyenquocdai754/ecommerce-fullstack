import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = async () => {
    try { setReviews((await api.get("/management/reviews")).data.data); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa tải được đánh giá."); }
  };
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(); }, 0); return () => window.clearTimeout(timer); }, []);
  const updateStatus = async (review) => {
    setError("");
    try { await api.patch(`/management/reviews/${review.id}/status`, { status: review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE" }); setNotice("Đã cập nhật trạng thái kiểm duyệt."); await refresh(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa cập nhật được đánh giá."); }
  };
  const deleteReview = async (review) => {
    if (!window.confirm(`Xóa vĩnh viễn đánh giá của ${review.full_name} cho sách “${review.book_title}”?`)) return;
    setError("");
    try { await api.delete(`/management/reviews/${review.id}`); setNotice("Đã xóa đánh giá vi phạm."); await refresh(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Chưa xóa được đánh giá."); }
  };
  const visibleReviews = reviews.filter((review) => (statusFilter === "ALL" || review.status === statusFilter) && `${review.book_title} ${review.full_name} ${review.comment} ${review.title || ""}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  return <main className="management-page"><header className="management-header"><Link to="/management">← Dashboard</Link><span>Kiểm duyệt đánh giá</span></header><section className="management-content"><h1>Đánh giá sản phẩm</h1>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="management-notice" role="status">{notice}</p>}<div className="management-filter-row"><input className="management-search" placeholder="Tìm theo sách, người đánh giá hoặc nội dung" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Lọc trạng thái đánh giá" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="VISIBLE">Đang hiển thị</option><option value="HIDDEN">Đang ẩn</option></select></div><div className="management-table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Người đánh giá</th><th>Sao</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleReviews.map((review) => <tr key={review.id}><td>{review.book_title}</td><td>{review.full_name}</td><td>★ {review.rating}</td><td>{review.title && <strong>{review.title}<br /></strong>}{review.comment}</td><td>{review.status}</td><td><div className="address-actions"><button className="outline-button" onClick={() => updateStatus(review)}>{review.status === "VISIBLE" ? "Ẩn" : "Khôi phục"}</button><button className="outline-button" onClick={() => deleteReview(review)}>Xóa</button></div></td></tr>)}</tbody></table>{visibleReviews.length === 0 && <p>Không tìm thấy đánh giá phù hợp.</p>}</div></section></main>;
}
