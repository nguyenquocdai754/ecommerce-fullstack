import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";

const API = "http://localhost:3000/api";
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
    };
  } catch {
    return { loggedIn: Boolean(token), name: "Độc giả" };
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [bookRes, categoryRes] = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/categories`),
      ]);
      if (!bookRes.ok)
        throw new Error("Không tải được sách. Hãy kiểm tra backend.");
      const bookData = await bookRes.json();
      const categoryData = categoryRes.ok ? await categoryRes.json() : null;
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
    window.setTimeout(load, 0);
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

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    const items = products.filter((p) => {
      const matchesCategory =
        category === "all" || String(p.category_id) === category;
      const text = [p.name, p.author, p.category_name, p.short_description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");
      return matchesCategory && (!term || text.includes(term));
    });
    return items.sort((a, b) => {
      if (sort === "price-up")
        return Number(a.sale_price) - Number(b.sale_price);
      if (sort === "price-down")
        return Number(b.sale_price) - Number(a.sale_price);
      if (sort === "name")
        return String(a.name).localeCompare(String(b.name), "vi");
      return Number(a.id) - Number(b.id);
    });
  }, [products, query, category, sort]);

  const count = cart.reduce((n, item) => n + item.quantity, 0);
  const total = cart.reduce(
    (n, item) => n + item.sale_price * item.quantity,
    0,
  );
  const search = (event) => {
    event.preventDefault();
    setQuery(queryInput);
    document
      .getElementById("catalogue")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const add = (product) => {
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
  const logout = () => {
    sessionStorage.clear();
    ["token", "user", "username", "expiresAt"].forEach((key) =>
      localStorage.removeItem(key),
    );
    setAuth({ loggedIn: false, name: "" });
    setNotice("Bạn đã đăng xuất.");
  };

  return (
    <div className="storefront">
      <div className="announcement">
        <div className="store-container announcement-inner">
          <span>Gửi trao tri thức, nuôi dưỡng tâm hồn</span>
          <span>Miễn phí vận chuyển từ 150.000đ</span>
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
                <option value="name">Tên A – Z</option>
                <option value="price-up">Giá thấp đến cao</option>
                <option value="price-down">Giá cao đến thấp</option>
              </select>
            </label>
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
              {visible.map((p) => {
                const out = Number(p.stock_quantity) <= 0;
                return (
                  <article className="product-card" key={p.id}>
                    <button
                      className="product-image"
                      type="button"
                      onClick={() => setDetail(p)}
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
                        onClick={() => setDetail(p)}
                      >
                        {p.name}
                      </button>
                      <p>{p.author || "An Nhiên tuyển chọn"}</p>
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
            <div className="modal-cover">
              {detail.thumbnail ? (
                <img src={detail.thumbnail} alt={detail.name} />
              ) : (
                "📖"
              )}
            </div>
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
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
