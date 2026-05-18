import { withTransaction } from "../config/db.js";

/**
 * Matching Engine — Week 4
 * Triet tieu race condition bang `SELECT ... FOR UPDATE` trong PostgreSQL.
 * Tat ca cac thao tac doc/ghi den asks/bids/transactions deu duoc bao trong 1 transaction.
 *
 * Quy tac FIFO (cap nhat tuan 3):
 *   - Lowest Ask:  ORDER BY price ASC,  created_at ASC, id ASC
 *   - Highest Bid: ORDER BY price DESC, created_at ASC, id ASC
 *
 * Khi `created_at` trung nhau, cot `id` (SERIAL PRIMARY KEY) la tiebreaker tuyet doi
 * vi PostgreSQL SEQUENCE dam bao monotonically increasing va unique.
 */

const insertOrderStatusLog = async (
  client,
  { transactionId, oldStatus, newStatus, changedBy = null, note = null }
) => {
  await client.query(
    `INSERT INTO order_status_logs
       (transaction_id, old_status, new_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [transactionId, oldStatus, newStatus, changedBy, note]
  );
};

/**
 * Buyer dat Bid moi.
 * Neu khop voi Lowest Ask (active, cung product+size, gia <=) -> tao Transaction.
 * Neu khong -> Bid van duoc luu voi status='active' va nam cho trong order book.
 */
export const matchNewBid = async ({ buyerId, productId, size, price }) =>
  withTransaction(async (client) => {
    // 1. Insert Bid moi truoc, lay id RETURNING.
    const bidInsert = await client.query(
      `INSERT INTO bids (buyer_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, buyer_id, product_id, size, price, status, created_at`,
      [buyerId, productId, size, price]
    );
    const newBid = bidInsert.rows[0];

    // 2. Tim Lowest Ask phu hop, LOCK row.
    const askLookup = await client.query(
      `SELECT id, seller_id, product_id, size, price, status, created_at
       FROM asks
       WHERE product_id = $1
         AND size       = $2
         AND status     = 'active'
         AND price     <= $3
       ORDER BY price ASC, created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE`,
      [productId, size, price]
    );

    if (askLookup.rowCount === 0) {
      // Khong co Ask phu hop -> bid nam cho.
      return {
        matched: false,
        bid: newBid,
        message: "Bid placed, waiting in order book",
      };
    }

    const ask = askLookup.rows[0];

    // 3. Cap nhat trang thai ca 2 ben.
    await client.query(`UPDATE asks SET status = 'matched' WHERE id = $1`, [
      ask.id,
    ]);
    await client.query(`UPDATE bids SET status = 'matched' WHERE id = $1`, [
      newBid.id,
    ]);

    // 4. Tao Transaction moi voi gia = ask.price (Ask la nguoi den truoc).
    const txInsert = await client.query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_shipment')
       RETURNING *`,
      [
        ask.id,
        newBid.id,
        newBid.buyer_id,
        ask.seller_id,
        productId,
        size,
        ask.price,
      ]
    );
    const transaction = txInsert.rows[0];

    // 5. Ghi audit trail.
    await insertOrderStatusLog(client, {
      transactionId: transaction.id,
      oldStatus: null,
      newStatus: "pending_shipment",
      changedBy: null,
      note: "Auto-matched: new Bid <-> existing Ask",
    });

    return {
      matched: true,
      bid: { ...newBid, status: "matched" },
      ask: { ...ask, status: "matched" },
      transaction,
      message: "Matched! Transaction created",
    };
  });

/**
 * Seller dat Ask moi. Doi xung voi matchNewBid.
 */
export const matchNewAsk = async ({ sellerId, productId, size, price }) =>
  withTransaction(async (client) => {
    const askInsert = await client.query(
      `INSERT INTO asks (seller_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, seller_id, product_id, size, price, status, created_at`,
      [sellerId, productId, size, price]
    );
    const newAsk = askInsert.rows[0];

    const bidLookup = await client.query(
      `SELECT id, buyer_id, product_id, size, price, status, created_at
       FROM bids
       WHERE product_id = $1
         AND size       = $2
         AND status     = 'active'
         AND price     >= $3
       ORDER BY price DESC, created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE`,
      [productId, size, price]
    );

    if (bidLookup.rowCount === 0) {
      return {
        matched: false,
        ask: newAsk,
        message: "Ask placed, waiting in order book",
      };
    }

    const bid = bidLookup.rows[0];

    await client.query(`UPDATE bids SET status = 'matched' WHERE id = $1`, [
      bid.id,
    ]);
    await client.query(`UPDATE asks SET status = 'matched' WHERE id = $1`, [
      newAsk.id,
    ]);

    const txInsert = await client.query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_shipment')
       RETURNING *`,
      [
        newAsk.id,
        bid.id,
        bid.buyer_id,
        newAsk.seller_id,
        productId,
        size,
        bid.price, // Bid la nguoi den truoc -> dung gia Bid
      ]
    );
    const transaction = txInsert.rows[0];

    await insertOrderStatusLog(client, {
      transactionId: transaction.id,
      oldStatus: null,
      newStatus: "pending_shipment",
      changedBy: null,
      note: "Auto-matched: new Ask <-> existing Bid",
    });

    return {
      matched: true,
      ask: { ...newAsk, status: "matched" },
      bid: { ...bid, status: "matched" },
      transaction,
      message: "Matched! Transaction created",
    };
  });

/**
 * Buy Now: Buyer mua ngay tai Lowest Ask hien co.
 * Khac matchNewBid o cho khong tao Bid moi (bid_id = NULL trong transactions).
 */
export const buyNow = async ({ buyerId, productId, size }) =>
  withTransaction(async (client) => {
    const askLookup = await client.query(
      `SELECT id, seller_id, product_id, size, price, status, created_at
       FROM asks
       WHERE product_id = $1 AND size = $2 AND status = 'active'
       ORDER BY price ASC, created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE`,
      [productId, size]
    );

    if (askLookup.rowCount === 0) {
      const err = new Error("No active Ask available for this product/size");
      err.status = 404;
      throw err;
    }

    const ask = askLookup.rows[0];

    if (ask.seller_id === buyerId) {
      const err = new Error("You cannot Buy Now your own Ask");
      err.status = 400;
      throw err;
    }

    await client.query(`UPDATE asks SET status = 'matched' WHERE id = $1`, [
      ask.id,
    ]);

    const txInsert = await client.query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, 'pending_shipment')
       RETURNING *`,
      [ask.id, buyerId, ask.seller_id, productId, size, ask.price]
    );
    const transaction = txInsert.rows[0];

    await insertOrderStatusLog(client, {
      transactionId: transaction.id,
      oldStatus: null,
      newStatus: "pending_shipment",
      changedBy: buyerId,
      note: "Buy Now",
    });

    return { matched: true, ask, transaction };
  });

/**
 * Sell Now: Seller ban ngay cho Highest Bid hien co.
 */
export const sellNow = async ({ sellerId, productId, size }) =>
  withTransaction(async (client) => {
    const bidLookup = await client.query(
      `SELECT id, buyer_id, product_id, size, price, status, created_at
       FROM bids
       WHERE product_id = $1 AND size = $2 AND status = 'active'
       ORDER BY price DESC, created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE`,
      [productId, size]
    );

    if (bidLookup.rowCount === 0) {
      const err = new Error("No active Bid available for this product/size");
      err.status = 404;
      throw err;
    }

    const bid = bidLookup.rows[0];

    if (bid.buyer_id === sellerId) {
      const err = new Error("You cannot Sell Now to your own Bid");
      err.status = 400;
      throw err;
    }

    await client.query(`UPDATE bids SET status = 'matched' WHERE id = $1`, [
      bid.id,
    ]);

    const txInsert = await client.query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, 'pending_shipment')
       RETURNING *`,
      [bid.id, bid.buyer_id, sellerId, productId, size, bid.price]
    );
    const transaction = txInsert.rows[0];

    await insertOrderStatusLog(client, {
      transactionId: transaction.id,
      oldStatus: null,
      newStatus: "pending_shipment",
      changedBy: sellerId,
      note: "Sell Now",
    });

    return { matched: true, bid, transaction };
  });
