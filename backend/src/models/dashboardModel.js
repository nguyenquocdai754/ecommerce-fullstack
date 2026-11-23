const pool = require("../config/database");

const getSummary = async () => {
  const [[orders]] = await pool.execute(
    `SELECT COUNT(*) AS total_orders,
            SUM(status IN ('PENDING','PENDING_PAYMENT')) AS pending_orders,
            SUM(status = 'COMPLETED') AS completed_orders,
            SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) AS revenue
     FROM orders`,
  );
  const [[books]] = await pool.execute(
    "SELECT COUNT(*) AS total_books, SUM(stock = 0) AS out_of_stock, SUM(stock BETWEEN 1 AND 5) AS low_stock FROM books WHERE status = 'ACTIVE'",
  );
  const [[customers]] = await pool.execute(
    "SELECT COUNT(*) AS total_customers FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'CUSTOMER'",
  );
  const [statusRows] = await pool.execute("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");
  const [dailyRevenue] = await pool.execute(
    `SELECT DATE(created_at) AS day, SUM(total_amount) AS revenue, COUNT(*) AS order_count
     FROM orders WHERE status = 'COMPLETED' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
     GROUP BY DATE(created_at) ORDER BY day ASC`,
  );
  const [bestSellers] = await pool.execute(
    `SELECT b.id, b.title, SUM(oi.quantity) AS units_sold
     FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN books b ON b.id = oi.book_id
     WHERE o.status <> 'CANCELLED' GROUP BY b.id, b.title
     ORDER BY units_sold DESC LIMIT 5`,
  );
  const statusCounts = Object.fromEntries(statusRows.map(({ status, count }) => [status, Number(count)]));
  return { ...orders, ...books, ...customers, status_counts: statusCounts, daily_revenue: dailyRevenue, best_sellers: bestSellers };
};

module.exports = { getSummary };
