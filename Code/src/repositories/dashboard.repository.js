const { query } = require('../config/db');

async function getDashboard({ from, to }) {
  const rangeValues = [from, to];
  const revenueStatuses = ['Paid', 'Packing', 'Shipped', 'Completed'];

  const [summaryResult, visitsResult, conversionResult, dailyResult, recentResult] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(total_amount) FILTER (WHERE status = ANY($3::text[])), 0)::numeric(14,2) AS total_revenue,
         COUNT(*)::int AS total_orders,
         COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_orders,
         COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_orders
       FROM orders
       WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')`,
      [...rangeValues, revenueStatuses]
    ),
    query(
      `SELECT COUNT(*)::int AS total_visits
         FROM website_visits
        WHERE visited_at >= $1::date AND visited_at < ($2::date + INTERVAL '1 day')`,
      rangeValues
    ),
    query(
      `SELECT COUNT(DISTINCT o.session_id)::int AS converted_visits
         FROM orders o
         JOIN website_visits v ON v.session_id = o.session_id
        WHERE o.session_id IS NOT NULL
          AND o.status <> 'Cancelled'
          AND o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')
          AND v.visited_at >= $1::date AND v.visited_at < ($2::date + INTERVAL '1 day')`,
      rangeValues
    ),
    query(
      `SELECT DATE(created_at) AS date,
              COALESCE(SUM(total_amount) FILTER (WHERE status = ANY($3::text[])), 0)::numeric(14,2) AS revenue,
              COUNT(*)::int AS orders
         FROM orders
        WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)`,
      [...rangeValues, revenueStatuses]
    ),
    query(
      `SELECT o.order_id, o.total_amount, o.status, o.payment_method, o.created_at,
              u.user_id, u.full_name, u.username
         FROM orders o JOIN users u ON u.user_id = o.user_id
        WHERE o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')
        ORDER BY o.created_at DESC
        LIMIT 10`,
      rangeValues
    ),
  ]);

  const summary = summaryResult.rows[0];
  const totalVisits = visitsResult.rows[0].total_visits;
  const convertedVisits = conversionResult.rows[0].converted_visits;
  const conversionRate = totalVisits > 0 ? Number(((convertedVisits / totalVisits) * 100).toFixed(2)) : 0;

  return {
    period: { from, to },
    summary: {
      totalRevenue: Number(summary.total_revenue),
      totalOrders: summary.total_orders,
      pendingOrders: summary.pending_orders,
      completedOrders: summary.completed_orders,
    },
    conversion: {
      trackedSessions: totalVisits,
      convertedSessions: convertedVisits,
      conversionRatePercent: conversionRate,
    },
    revenueByDay: dailyResult.rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
      orders: row.orders,
    })),
    recentOrders: recentResult.rows.map((row) => ({
      ...row,
      total_amount: Number(row.total_amount),
    })),
  };
}

module.exports = { getDashboard };
