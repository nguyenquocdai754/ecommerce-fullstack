import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [username] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.username || parsedUser.name || "Độc giả";
      } catch {
        return "Độc giả";
      }
    }
    return localStorage.getItem("username") || "";
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("http://localhost:3000/api/products"),
          fetch("http://localhost:3000/api/categories"),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) setProducts(prodData.data);
        if (catData.success) setCategories(catData.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để thêm sách vào giỏ hàng!");
      navigate("/login");
      return;
    }
    alert(`Đã thêm sách "${product.name}" vào giỏ hàng!`);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div
      style={{
        backgroundColor: "#f9f8f6",
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        paddingBottom: "60px",
      }}
    >
      {/* 1. TOP BAR VIẾT LẠI CHỈN CHU & HIỂN THỊ TÊN TÀI KHOẢN */}
      <div
        style={{
          backgroundColor: "#2f3e30",
          color: "#c2cdc3",
          fontSize: "13px",
          padding: "10px 32px",
          display: "flex",
          justifyContent: "space-between",
          letterSpacing: "0.5px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          <span style={{ cursor: "pointer" }}>Kênh Nhà Sách</span>
          <span>|</span>
          <span style={{ cursor: "pointer" }}>Chính sách đổi trả</span>
          <span>|</span>
          <span style={{ cursor: "pointer" }}>Hỗ trợ độc giả</span>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {localStorage.getItem("token") ? (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={{ color: "#fff", fontWeight: "500" }}>
                👋 Chào,{" "}
                <strong style={{ color: "#e2ece1" }}>
                  {username || "Bạn"}
                </strong>
                !
              </span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #c2cdc3",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  color: "#c2cdc3",
                  cursor: "pointer",
                  fontSize: "12px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3b4d3c";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#c2cdc3";
                }}
              >
                Đăng Xuất
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => navigate("/register")}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                }}
              >
                Đăng Ký
              </button>
              <span style={{ color: "#666" }}>|</span>
              <button
                onClick={() => navigate("/login")}
                style={{
                  backgroundColor: "#4a5d4e",
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                }}
              >
                Đăng Nhập
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN HEADER (Sticky Search Bar) */}
      <div
        style={{
          backgroundColor: "#3b4d3c",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <div
            style={{
              backgroundColor: "#5c7360",
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            📚
          </div>
          <h2
            style={{
              color: "#fff",
              margin: 0,
              fontSize: "22px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            An Nhiên Books
          </h2>
        </div>

        <div style={{ flex: 1, maxWidth: "600px", margin: "0 40px" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#fff",
              borderRadius: "6px",
              padding: "4px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <input
              type="text"
              placeholder="Tìm kiếm tựa sách, tác giả, thể loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                padding: "10px 16px",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "transparent",
              }}
            />
            <button
              style={{
                backgroundColor: "#4a5d4e",
                border: "none",
                padding: "0 24px",
                color: "#fff",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#4a5d4e",
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            fontSize: "18px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
          onClick={() => alert("Chức năng giỏ hàng")}
          title="Giỏ hàng của bạn"
        >
          🛒
        </div>
      </div>

      {/* 3. CONTAINER CHÍNH */}
      <div
        style={{ maxWidth: "1200px", margin: "32px auto", padding: "0 20px" }}
      >
        {/* Banner Section */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
          <div
            style={{
              flex: 2,
              background: "linear-gradient(135deg, #4a5d4e 0%, #2f3e30 100%)",
              borderRadius: "12px",
              padding: "48px",
              color: "#f7f5f0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(58,77,60,0.15)",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#a3b5a4",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Không gian tri thức
            </span>
            <h1
              style={{
                fontSize: "36px",
                margin: "0 0 14px 0",
                fontWeight: "700",
                lineHeight: "1.2",
              }}
            >
              Nuôi dưỡng tâm hồn qua từng trang sách
            </h1>
            <p
              style={{
                fontSize: "15px",
                margin: "0 0 20px 0",
                opacity: 0.85,
                lineHeight: "1.6",
                maxWidth: "480px",
              }}
            >
              Khám phá hàng ngàn tựa sách chọn lọc với ưu đãi vận chuyển toàn
              quốc cho đơn hàng từ 150.000đ.
            </p>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e8e3",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#4a5d4e",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                SÁCH HAY THÁNG 6
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#444",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Giảm đến 30% các tựa sách văn học kinh điển và phát triển bản
                thân.
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e8e3",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#4a5d4e",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                ĐỘC GIẢ THÂN THIẾT
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#444",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Tích điểm đổi quà, nhận voucher độc quyền mỗi tuần cho hội viên.
              </p>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{ marginBottom: "40px" }}>
          <h3
            style={{
              color: "#2f3e30",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Danh Mục Sách
          </h3>
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            <div
              style={{
                backgroundColor: "#3b4d3c",
                color: "#fff",
                padding: "10px 22px",
                borderRadius: "24px",
                fontSize: "14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontWeight: "500",
                boxShadow: "0 2px 6px rgba(59,77,60,0.2)",
              }}
            >
              Tất cả sách
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  backgroundColor: "#fff",
                  color: "#4a5d4e",
                  padding: "10px 22px",
                  borderRadius: "24px",
                  border: "1px solid #d5ddd4",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {cat.name}
              </div>
            ))}
          </div>
        </div>

        {/* Products Grid Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              color: "#2f3e30",
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
            }}
          >
            Tựa Sách Đang Phục Vụ
          </h3>
          <span style={{ fontSize: "13px", color: "#666" }}>
            Hiển thị {filteredProducts.length} sản phẩm
          </span>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#666",
              fontSize: "15px",
            }}
          >
            Đang tải danh mục sách...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e8e3",
              color: "#666",
            }}
          >
            Không tìm thấy tựa sách nào phù hợp với từ khóa của bạn.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock_quantity === 0;
              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "10px",
                    border: "1px solid #e8ede7",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(59,77,60,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.03)";
                  }}
                >
                  <div
                    style={{ position: "relative", backgroundColor: "#f0f3ef" }}
                  >
                    {isOutOfStock && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#a65b5b",
                          color: "#fff",
                          padding: "3px 10px",
                          fontSize: "11px",
                          borderRadius: "4px",
                          fontWeight: "600",
                          zIndex: 2,
                        }}
                      >
                        Hết sách
                      </span>
                    )}
                    <img
                      src={
                        product.thumbnail ||
                        "https://placehold.co/300x400/png?text=Book+Cover"
                      }
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "240px",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#2c352d",
                          height: "42px",
                          overflow: "hidden",
                          marginBottom: "10px",
                          lineHeight: "1.4",
                          fontWeight: "600",
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#777",
                          height: "36px",
                          overflow: "hidden",
                          marginBottom: "12px",
                          lineHeight: "1.4",
                        }}
                      >
                        {product.short_description ||
                          "Sách hay tuyển chọn dành cho độc giả yêu tri thức."}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                          marginBottom: "14px",
                        }}
                      >
                        <span
                          style={{
                            color: "#3b4d3c",
                            fontSize: "17px",
                            fontWeight: "700",
                          }}
                        >
                          {Number(product.sale_price).toLocaleString("vi-VN")} đ
                        </span>
                        {product.sale_price < product.original_price && (
                          <span
                            style={{
                              color: "#999",
                              fontSize: "12px",
                              textDecoration: "line-through",
                            }}
                          >
                            {Number(product.original_price).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        style={{
                          width: "100%",
                          padding: "10px",
                          backgroundColor: isOutOfStock ? "#e2e7e2" : "#3b4d3c",
                          color: isOutOfStock ? "#888" : "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isOutOfStock)
                            e.currentTarget.style.backgroundColor = "#2f3e30";
                        }}
                        onMouseLeave={(e) => {
                          if (!isOutOfStock)
                            e.currentTarget.style.backgroundColor = "#3b4d3c";
                        }}
                      >
                        {isOutOfStock ? "Tạm Hết Sách" : "Thêm Vào Giỏ"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;