import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./HomePage.css";

const CART_KEY = "an-nhien-cart";
const readCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
const readAuth = () => {
  const token = sessionStorage.getItem("token");
  const expiry = Number(sessionStorage.getItem("expiresAt"));
  if (token && expiry && Date.now() >= expiry) {
    sessionStorage.clear();
    return { loggedIn: false, name: "" };
  }
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    return {
      loggedIn: Boolean(token),
      name:
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        sessionStorage.getItem("username") ||
        "Độc giả",
      role: user?.role || "",
      userId: user?.id || null,
    };
  } catch {
    return { loggedIn: Boolean(token), name: "Độc giả", role: "" };
  }
};
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(readCart);
  const [auth, setAuth] = useState(readAuth);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [selectedDetailImage, setSelectedDetailImage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: 0 });
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, title: "", comment: "" });
  const [myReview, setMyReview] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [bookRes, categoryRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      const bookData = bookRes.data;
      const categoryData = categoryRes.data;
      if (!bookData.success || !Array.isArray(bookData.data))
        throw new Error(bookData.message || "Dữ liệu sách không hợp lệ.");
      setProducts(bookData.data);
      setCategories(
        categoryData?.success && Array.isArray(categoryData.data)
          ? categoryData.data
          : [],
      );
    } catch (error) {
      setLoadError(error.message || "Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    const sync = () => setAuth(readAuth());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const ownReviewRequest = auth.loggedIn && auth.role === "CUSTOMER"
      ? api.get(`/reviews/mine?bookId=${detail.id}`)
      : Promise.resolve({ data: { data: null } });
    Promise.all([api.get(`/products/${detail.id}/reviews`), ownReviewRequest]).then(([publicResult, ownResult]) => {
      if (active) {
        setReviews(publicResult.data.data || []);
        setReviewSummary(publicResult.data.summary || { count: 0, average: 0 });
        setMyReview(ownResult.data.data || null);
        if (ownResult.data.data) setReviewDraft({ rating: ownResult.data.data.rating, title: ownResult.data.data.title || "", comment: ownResult.data.data.comment || "" });
        else setReviewDraft({ rating: 5, title: "", comment: "" });
      }
    }).catch(() => { if (active) { setReviews([]); setMyReview(null); } });
    return () => { active = false; };
  }, [detail, auth.loggedIn, auth.role, auth.userId]);

  const detailId = detail?.id;
  useEffect(() => {
    if (!detailId) return undefined;
    let active = true;
    api.get(`/products/${detailId}`).then(({ data }) => {
      if (active) setDetail((current) => current?.id === detailId ? { ...current, ...data.data } : current);
    }).catch(() => {});
    return () => { active = false; };
  }, [detailId]);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    const items = products.filter((p) => {
      const matchesCategory =
        category === "all" || String(p.category_id) === category;
      const price = Number(p.sale_price);
      const matchesPrice =
        (!minPrice || price >= Number(minPrice)) &&
        (!maxPrice || price <= Number(maxPrice));
      const matchesStock = !inStockOnly || Number(p.stock_quantity) > 0;
      const text = [p.name, p.author, p.category_name, p.short_description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");
      return (
        matchesCategory && matchesPrice && matchesStock && (!term || text.includes(term))
      );
    });
    return items.sort((a, b) => {
      if (sort === "price-up")
        return Number(a.sale_price) - Number(b.sale_price);
      if (sort === "price-down")
        return Number(b.sale_price) - Number(a.sale_price);
      if (sort === "name")
        return String(a.name).localeCompare(String(b.name), "vi");
      if (sort === "name-desc")
        return String(b.name).localeCompare(String(a.name), "vi");
      if (sort === "newest") return Number(b.id) - Number(a.id);
      return Number(a.id) - Number(b.id);
    });
  }, [products, query, category, sort, minPrice, maxPrice, inStockOnly]);

  const count = cart.reduce((n, item) => n + item.quantity, 0);
  const total = cart.reduce(
    (n, item) => n + item.sale_price * item.quantity,
    0,
  );
  const detailImages = detail ? [...new Set([detail.thumbnail, ...(detail.images || []).map((image) => image.image_url)].filter(Boolean))] : [];
  const search = (event) => {
    event.preventDefault();
    setQuery(queryInput);
    document
      .getElementById("catalogue")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const openDetail = (product) => { setSelectedDetailImage(product.thumbnail || ""); setDetail(product); };
  const add = (product) => {
    if (!auth.loggedIn) {
      setNotice("Đăng nhập để thêm sách vào giỏ hàng.");
      navigate("/login", { state: { from: "/" } });
      return;
    }
    const id = String(product.id);
    const stock = Number(product.stock_quantity);
    if (stock <= 0) {
      setNotice("Sách này hiện đã hết hàng.");
      return;
    }
    setCart((items) => {
      const found = items.find((item) => String(item.id) === id);
      if (found && found.quantity >= stock) {
        setNotice("Đã đạt số lượng còn trong kho.");
        return items;
      }
      return found
        ? items.map((item) =>
            String(item.id) === id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [
            ...items,
            {
              id,
              name: product.name,
              author: product.author || "",
              thumbnail: product.thumbnail || "",
              sale_price: Number(product.sale_price),
              stock_quantity: stock,
              quantity: 1,
            },
          ];
    });
    setNotice(`Đã thêm “${product.name}” vào giỏ.`);
  };
  const quantity = (id, delta) =>
    setCart((items) =>
      items
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Math.min(
                  Number(item.stock_quantity) || 99,
                  item.quantity + delta,
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  const buyNow = (product) => {
    if (!auth.loggedIn) { setNotice("Đăng nhập để mua hàng."); navigate("/login", { state: { from: "/checkout" } }); return; }
    const id = String(product.id);
    const stock = Number(product.stock_quantity);
    if (stock <= 0) { setNotice("Sách này hiện đã hết hàng."); return; }
    const existing = cart.find((item) => String(item.id) === id);
    const next = existing
      ? cart.map((item) => String(item.id) === id ? { ...item, quantity: Math.min(stock, item.quantity + 1), sale_price: product.sale_price, stock_quantity: stock } : item)
      : [...cart, { id, name: product.name, author: product.author || "", thumbnail: product.thumbnail || "", sale_price: Number(product.sale_price), stock_quantity: stock, quantity: 1 }];
    localStorage.setItem(CART_KEY, JSON.stringify(next)); setCart(next); navigate("/checkout");
  };
  const logout = () => {
    sessionStorage.clear();
    ["token", "user", "username", "expiresAt"].forEach((key) =>
      localStorage.removeItem(key),
    );
    setAuth({ loggedIn: false, name: "", role: "" });
    setCart([]);
    setNotice("Bạn đã đăng xuất.");
  };
  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");
    try {
      if (myReview) await api.put(`/reviews/${myReview.id}`, reviewDraft);
      else await api.post(`/products/${detail.id}/reviews`, reviewDraft);
      const [publicResult, ownResult] = await Promise.all([api.get(`/products/${detail.id}/reviews`), api.get(`/reviews/mine?bookId=${detail.id}`)]);
      setReviews(publicResult.data.data || []); setReviewSummary(publicResult.data.summary || { count: 0, average: 0 }); setMyReview(ownResult.data.data || null);
      setNotice(myReview ? "Đã cập nhật đánh giá." : "Đã gửi đánh giá của bạn.");
    } catch (error) {
      setReviewError(error.response?.data?.message || "Chưa gửi được đánh giá.");
    }
  };
  const editReview = async (review) => {
    const comment = window.prompt("Chỉnh sửa nhận xét:", review.comment);
    if (comment === null || !comment.trim()) return;
    const ratingValue = window.prompt("Số sao từ 1 đến 5:", String(review.rating));
    if (ratingValue === null) return;
    try {
      await api.put(`/reviews/${review.id}`, { rating: Number(ratingValue), title: review.title || "", comment });
      const [publicResult, ownResult] = await Promise.all([api.get(`/products/${detail.id}/reviews`), api.get(`/reviews/mine?bookId=${detail.id}`)]);
      setReviews(publicResult.data.data || []); setReviewSummary(publicResult.data.summary || { count: 0, average: 0 }); setMyReview(ownResult.data.data || null);
    } catch (error) { setReviewError(error.response?.data?.message || "Chưa sửa được đánh giá."); }
  };
  const deleteReview = async (review) => {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await api.delete(`/reviews/${review.id}`);
      const [publicResult, ownResult] = await Promise.all([api.get(`/products/${detail.id}/reviews`), api.get(`/reviews/mine?bookId=${detail.id}`)]);
      setReviews(publicResult.data.data || []); setReviewSummary(publicResult.data.summary || { count: 0, average: 0 }); setMyReview(ownResult.data.data || null);
    } catch (error) { setReviewError(error.response?.data?.message || "Chưa xóa được đánh giá."); }
  };

  return (
    <div className="storefront">
      <div className="announcement">
        <div className="store-container announcement-inner">
          <span>Gửi trao tri thức, nuôi dưỡng tâm hồn</span>
          <span>Đóng gói cẩn thận · Giao sách toàn quốc</span>
        </div>
      </div>
      <header className="site-header">
        <div className="store-container header-main">
          <Link className="brand" to="/">
            <span className="brand-mark">📚</span>
            <span>
              <strong>An Nhiên</strong>
              <small>BOOKS & MORE</small>
            </span>
          </Link>
          <form className="search-form" onSubmit={search} role="search">
            <input
              aria-label="Tìm sách"
              placeholder="Tìm theo tên sách, tác giả, thể loại..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            {queryInput && (
              <button
                className="clear-search"
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setQuery("");
                }}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
            <button className="search-submit" type="submit">
              Tìm sách
            </button>
          </form>
          <div className="header-actions">
            {auth.loggedIn ? (
              <div className="account-links">
                <span>Xin chào, {auth.name}</span>
                {auth.role === "CUSTOMER" && <><Link to="/profile">Tài khoản</Link><Link to="/orders">Đơn hàng</Link></>}
                {["MANAGER", "ADMIN"].includes(auth.role) && <Link to="/management">Quản lý</Link>}
                <button className="link-button" type="button" onClick={logout}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="account-links">
                <Link to="/register">Đăng ký</Link>
                <Link className="login-link" to="/login">
                  Đăng nhập
                </Link>
              </div>
            )}
            <button
              className="cart-button"
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Giỏ hàng có ${count} sản phẩm`}
            >
              🛒 <span>Giỏ hàng</span>
              <b>{count}</b>
            </button>
          </div>
        </div>
        <nav className="store-nav">
          <div className="store-container nav-inner">
            <a href="#catalogue">Sách đang bán</a>
            <a href="#categories">Danh mục</a>
            <a href="#about">Về An Nhiên</a>
            <span>Giao hàng toàn quốc</span>
          </div>
        </nav>
      </header>

      <main className="store-container">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">MỞ TRANG SÁCH, MỞ CHÂN TRỜI</span>
            <h1>
              Một cuốn sách hay
              <br />
              cho một ngày an nhiên.
            </h1>
            <p>
              Chọn những cuốn sách giúp bạn học điều mới, sống sâu hơn và tìm
              cảm hứng mỗi ngày.
            </p>
            <a className="primary-button" href="#catalogue">
              Khám phá sách <span>→</span>
            </a>
            <small>✦ Tuyển chọn bởi người yêu sách · Giao hàng toàn quốc</small>
          </div>
          <div className="hero-art" role="img" aria-label="Những cuốn sách">
            <div className="hero-sun"></div>
            <div className="book-stack">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <b>
              READ
              <br />& GROW
            </b>
            <small>
              Thời gian dành cho mình,
              <br />
              bắt đầu từ một trang sách.
            </small>
          </div>
        </section>

        <section className="benefits">
          <div>
            <b>📦</b>
            <span>
              <strong>Giao hàng toàn quốc</strong>
              <small>Đóng gói cẩn thận mỗi đơn</small>
            </span>
          </div>
          <div>
            <b>🌿</b>
            <span>
              <strong>Sách chọn lọc</strong>
              <small>Nội dung chất lượng, hữu ích</small>
            </span>
          </div>
          <div>
            <b>🎁</b>
            <span>
              <strong>Ưu đãi thành viên</strong>
              <small>Tích điểm và nhận quà</small>
            </span>
          </div>
        </section>

        <section className="catalogue" id="catalogue">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TÌM CUỐN SÁCH TIẾP THEO</span>
              <h2>Khám phá sách</h2>
            </div>
            <label className="sort-control">
              Sắp xếp{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Nổi bật</option>
                <option value="newest">Mới nhất</option>
                <option value="name">Tên A – Z</option>
                <option value="name-desc">Tên Z – A</option>
                <option value="price-up">Giá thấp đến cao</option>
                <option value="price-down">Giá cao đến thấp</option>
              </select>
            </label>
          </div>
          <div className="catalogue-filters" aria-label="Bộ lọc sản phẩm">
            <label>Giá từ<input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0 đ" /></label>
            <label>Đến<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Không giới hạn" /></label>
            <label className="stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} /> Chỉ còn hàng</label>
          </div>
          <div
            className="category-row"
            id="categories"
            aria-label="Lọc theo danh mục"
          >
            <button
              className={
                category === "all" ? "category-chip active" : "category-chip"
              }
              type="button"
              onClick={() => setCategory("all")}
            >
              Tất cả sách <span>{products.length}</span>
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                className={
                  category === String(item.id)
                    ? "category-chip active"
                    : "category-chip"
                }
                type="button"
                onClick={() => setCategory(String(item.id))}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="results-line">
            <span>
              {query ? (
                <>
                  Kết quả cho <b>“{query}”</b>
                </>
              ) : (
                "Sách dành cho bạn"
              )}
            </span>
            <span>{visible.length} tựa sách</span>
          </div>
          {loading ? (
            <div className="message">Đang tải danh sách sách…</div>
          ) : loadError ? (
            <div className="message error">
              <strong>Chưa tải được sách</strong>
              <span>{loadError}</span>
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadError("");
                  load();
                }}
              >
                Thử tải lại
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="message">
              <strong>Chưa tìm thấy sách phù hợp</strong>
              <span>Thử từ khóa khác hoặc xem tất cả danh mục.</span>
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setQuery("");
                  setCategory("all");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {visible.slice(0, showAll ? visible.length : 12).map((p) => {
                const out = Number(p.stock_quantity) <= 0;
                return (
                  <article className="product-card" key={p.id}>
                    <button
                      className="product-image"
                      type="button"
                      onClick={() => openDetail(p)}
                      aria-label={`Xem ${p.name}`}
                    >
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} loading="lazy" />
                      ) : (
                        <span className="placeholder-cover">
                          AN NHIÊN
                          <br />
                          BOOKS
                          <br />
                          <b>📖</b>
                        </span>
                      )}
                      {out ? (
                        <span className="badge sold-out">Hết hàng</span>
                      ) : (
                        p.category_name && (
                          <span className="badge">{p.category_name}</span>
                        )
                      )}
                    </button>
                    <div className="product-info">
                      <button
                        className="product-title"
                        type="button"
                        onClick={() => openDetail(p)}
                      >
                        {p.name}
                      </button>
                      <p>{p.author || "An Nhiên tuyển chọn"}</p>
                      {p.review_count > 0 && <small className="product-rating">★ {Number(p.average_rating).toFixed(1)} · {p.review_count} đánh giá</small>}
                      <div className="product-bottom">
                        <strong>{money(p.sale_price)}</strong>
                        <button
                          type="button"
                          disabled={out}
                          onClick={() => add(p)}
                        >
                          {out ? "Tạm hết" : "＋ Thêm"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !loadError && visible.length > 12 && (
            <button className="outline-button load-more" type="button" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Thu gọn danh sách" : `Xem thêm ${visible.length - 12} tựa sách`}
            </button>
          )}
        </section>
        <section className="about-strip" id="about">
          <span>✦</span>
          <div>
            <strong>Góc nhỏ dành cho người yêu sách</strong>
            <p>
              Mong mỗi lần mở sách là một lần bạn tìm được điều gì đó thật đẹp.
            </p>
          </div>
          <a href="#catalogue">Chọn sách ngay →</a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="store-container footer-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">📚</span>
            <span>
              <strong>An Nhiên</strong>
              <small>BOOKS & MORE</small>
            </span>
          </Link>
          <span>
            © {new Date().getFullYear()} An Nhiên Books · Đọc để sống thêm nhiều
            cuộc đời.
          </span>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Lên đầu trang ↑
          </a>
        </div>
      </footer>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Giỏ hàng"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">AN NHIÊN BOOKS</span>
                <h2>
                  Giỏ hàng <small>({count})</small>
                </h2>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span>🛒</span>
                <strong>Giỏ hàng đang trống</strong>
                <p>Thêm cuốn sách bạn yêu thích nhé.</p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setCartOpen(false)}
                >
                  Tiếp tục chọn sách
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-thumb">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" />
                        ) : (
                          "📖"
                        )}
                      </div>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>{money(item.sale_price)}</span>
                        <div className="quantity-row">
                          <button
                            type="button"
                            onClick={() => quantity(item.id, -1)}
                            aria-label="Giảm"
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.stock_quantity}
                            onClick={() => quantity(item.id, 1)}
                            aria-label="Tăng"
                          >
                            ＋
                          </button>
                          <button
                            className="remove-button"
                            type="button"
                            onClick={() =>
                              setCart((items) =>
                                items.filter(
                                  (x) => String(x.id) !== String(item.id),
                                ),
                              )
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <p>
                    <span>Tạm tính</span>
                    <strong>{money(total)}</strong>
                  </p>
                  <small>Phí vận chuyển sẽ được tính khi xác nhận đơn.</small>
                  {!auth.loggedIn && (
                    <button
                      className="checkout-button"
                      type="button"
                      onClick={() => navigate("/login")}
                    >
                      Đăng nhập để tiếp tục
                    </button>
                  )}
                  {auth.loggedIn && (
                    <button
                      className="checkout-button"
                      type="button"
                      onClick={() => navigate("/checkout")}
                    >
                      Tiến hành đặt hàng
                    </button>
                  )}
                  <button
                    className="continue-button"
                    type="button"
                    onClick={() => setCartOpen(false)}
                  >
                    Tiếp tục mua sách
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {detail && (
        <div className="overlay modal-overlay" onClick={() => setDetail(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button modal-close"
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Đóng"
            >
              ×
            </button>
            <div className="product-gallery"><div className="modal-cover">{selectedDetailImage || detail.thumbnail ? <img src={selectedDetailImage || detail.thumbnail} alt={detail.name} /> : "📖"}</div>{detailImages.length > 1 && <div className="gallery-thumbnails" aria-label="Bộ sưu tập hình ảnh">{detailImages.map((imageUrl) => <button type="button" key={imageUrl} className={imageUrl === (selectedDetailImage || detail.thumbnail) ? "active" : ""} onClick={() => setSelectedDetailImage(imageUrl)} aria-label={`Xem ảnh ${detailImages.indexOf(imageUrl) + 1}`}><img src={imageUrl} alt="" /></button>)}</div>}</div>
            <div className="modal-copy">
              <span className="eyebrow">
                {detail.category_name || "SÁCH TUYỂN CHỌN"}
              </span>
              <h2 id="book-title">{detail.name}</h2>
              <p className="author-line">
                Tác giả: {detail.author || "Đang cập nhật"}
              </p>
              <strong className="modal-price">
                {money(detail.sale_price)}
              </strong>
              <p className="description">
                {detail.short_description ||
                  "Một tựa sách được An Nhiên tuyển chọn dành cho bạn đọc yêu tri thức."}
              </p>
              <p className="product-sold-count">Đã bán {detail.sold_count || 0} cuốn</p>
              <div className="review-summary"><strong>★ {Number(reviewSummary.average).toFixed(1)}</strong><span>{reviewSummary.count} đánh giá</span></div>
              <div className="review-list">{reviews.length ? reviews.map((review) => <article key={review.id}><div><strong>{review.full_name}</strong><span>★ {review.rating} · {new Date(review.created_at).toLocaleDateString("vi-VN")}</span></div>{review.title && <b>{review.title}</b>}<p>{review.comment}</p>{auth.loggedIn && Number(auth.userId) === Number(review.user_id) && <div className="review-actions"><button type="button" onClick={() => editReview(review)}>Sửa</button><button type="button" onClick={() => deleteReview(review)}>Xóa</button></div>}</article>) : <small>Chưa có đánh giá cho sách này.</small>}</div>
              {auth.loggedIn && auth.role === "CUSTOMER" && <form className="review-form" onSubmit={submitReview}><strong>{myReview ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá sau khi nhận sách"}</strong><label>Số sao<select value={reviewDraft.rating} onChange={(e) => setReviewDraft({ ...reviewDraft, rating: Number(e.target.value) })}><option value={5}>5 sao</option><option value={4}>4 sao</option><option value={3}>3 sao</option><option value={2}>2 sao</option><option value={1}>1 sao</option></select></label><input maxLength="160" placeholder="Tiêu đề (không bắt buộc)" value={reviewDraft.title} onChange={(e) => setReviewDraft({ ...reviewDraft, title: e.target.value })} /><textarea required maxLength="3000" placeholder="Chia sẻ cảm nhận của bạn" value={reviewDraft.comment} onChange={(e) => setReviewDraft({ ...reviewDraft, comment: e.target.value })} />{reviewError && <small className="form-error">{reviewError}</small>}<button className="outline-button">{myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}</button>{myReview?.status === "HIDDEN" && <small>Đánh giá đang được ẩn; bạn vẫn có thể chỉnh sửa hoặc xóa.</small>}</form>}
              <small>
                {Number(detail.stock_quantity) > 0
                  ? `Còn ${detail.stock_quantity} cuốn`
                  : "Hiện đã hết hàng"}
              </small>
              <button
                className="checkout-button"
                disabled={Number(detail.stock_quantity) <= 0}
                type="button"
                onClick={() => add(detail)}
              >
                Thêm vào giỏ hàng
              </button>
              {auth.loggedIn && auth.role === "CUSTOMER" && Number(detail.stock_quantity) > 0 && <button className="outline-button buy-now-button" type="button" onClick={() => buyNow(detail)}>Mua ngay</button>}
              {products.some((product) => Number(product.id) !== Number(detail.id) && Number(product.category_id) === Number(detail.category_id)) && <div className="related-products"><h3>Sách cùng danh mục</h3>{products.filter((product) => Number(product.id) !== Number(detail.id) && Number(product.category_id) === Number(detail.category_id)).slice(0, 4).map((product) => <button type="button" key={product.id} onClick={() => openDetail(product)}>{product.name} · {money(product.sale_price)}</button>)}</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
