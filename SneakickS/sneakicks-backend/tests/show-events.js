/**
 * In cac su kien hanh vi gan nhat trong bang user_events (chi doc).
 *   node tests/show-events.js [so_dong]
 */
import { query, closePool } from "../src/config/db.js";

const limit = Number(process.argv[2]) || 30;

const main = async () => {
  const { rows } = await query(
    `SELECT e.id,
            COALESCE(u.username, 'guest')            AS "user",
            LEFT(e.session_id, 8)                    AS session,
            e.event_type                             AS type,
            e.product_id                             AS pid,
            LEFT(p.name, 34)                         AS product,
            e.query,
            e.dwell_ms,
            e.source,
            to_char(e.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
       FROM user_events e
       LEFT JOIN users u    ON u.id = e.user_id
       LEFT JOIN products p ON p.id = e.product_id
      ORDER BY e.id DESC
      LIMIT $1`,
    [limit]
  );
  console.table(rows.reverse());

  const { rows: summary } = await query(
    `SELECT event_type, COUNT(*)::int AS events,
            COUNT(DISTINCT session_id)::int AS sessions,
            ROUND(AVG(dwell_ms))::int AS avg_dwell_ms
       FROM user_events GROUP BY event_type ORDER BY event_type`
  );
  console.table(summary);
};

main().finally(() => closePool());
