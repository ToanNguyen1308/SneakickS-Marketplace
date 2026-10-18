-- =====================================================================
-- SneakickS Marketplace — Database Schema
-- Dialect: PostgreSQL >= 13
-- GR1: 11 bang (ERD Tuan 2 + notifications)
-- GR2 (lan 2): + thuoc tinh san pham cho Content-based
--              + bang user_events (ghi nhan hanh vi cho he goi y)
-- =====================================================================

-- Drop in reverse dependency order so this script can be re-run safely.
DROP TABLE IF EXISTS user_events        CASCADE;
DROP TABLE IF EXISTS notifications      CASCADE;
DROP TABLE IF EXISTS order_status_logs CASCADE;
DROP TABLE IF EXISTS follows           CASCADE;
DROP TABLE IF EXISTS seller_ratings    CASCADE;
DROP TABLE IF EXISTS verifications     CASCADE;
DROP TABLE IF EXISTS transactions      CASCADE;
DROP TABLE IF EXISTS bids              CASCADE;
DROP TABLE IF EXISTS asks              CASCADE;
DROP TABLE IF EXISTS products          CASCADE;
DROP TABLE IF EXISTS categories        CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- =====================================================================
-- 1. users
-- =====================================================================
CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================================
-- 2. categories
-- =====================================================================
CREATE TABLE categories (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    image_url   VARCHAR(500)
);

-- =====================================================================
-- 3. products
-- =====================================================================
CREATE TABLE products (
    id            SERIAL        PRIMARY KEY,
    name          VARCHAR(200)  NOT NULL,
    brand         VARCHAR(100)  NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    category_id   INT           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    release_date  DATE,
    retail_price  DECIMAL(10,2) CHECK (retail_price IS NULL OR retail_price > 0),
    sku           VARCHAR(40)   UNIQUE,
    silhouette    VARCHAR(100),
    colorway      VARCHAR(100),
    colors        VARCHAR(100),
    gender        VARCHAR(10)   NOT NULL DEFAULT 'unisex'
                  CHECK (gender IN ('men', 'women', 'unisex', 'kids')),
    size_type     VARCHAR(10)   NOT NULL DEFAULT 'shoe'
                  CHECK (size_type IN ('shoe', 'apparel', 'os')),
    tags          TEXT,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand      ON products(brand);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_silhouette ON products(silhouette);

-- =====================================================================
-- 4. asks  (lenh ban)
-- =====================================================================
CREATE TABLE asks (
    id          SERIAL        PRIMARY KEY,
    seller_id   INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size        VARCHAR(10)   NOT NULL,
    price       DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status      VARCHAR(20)   NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'matched', 'cancelled')),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Composite index toi uu cho Matching Engine (Lowest Ask, FIFO).
CREATE INDEX idx_asks_match
    ON asks (product_id, size, status, price ASC, created_at ASC, id ASC);

CREATE INDEX idx_asks_seller ON asks(seller_id);

-- =====================================================================
-- 5. bids  (lenh mua)
-- =====================================================================
CREATE TABLE bids (
    id          SERIAL        PRIMARY KEY,
    buyer_id    INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size        VARCHAR(10)   NOT NULL,
    price       DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status      VARCHAR(20)   NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'matched', 'cancelled')),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Composite index toi uu cho Matching Engine (Highest Bid, FIFO).
CREATE INDEX idx_bids_match
    ON bids (product_id, size, status, price DESC, created_at ASC, id ASC);

CREATE INDEX idx_bids_buyer ON bids(buyer_id);

-- =====================================================================
-- 6. transactions  (giao dich da khop lenh)
-- =====================================================================
CREATE TABLE transactions (
    id          SERIAL        PRIMARY KEY,
    ask_id      INT           REFERENCES asks(id) ON DELETE SET NULL,
    bid_id      INT           REFERENCES bids(id) ON DELETE SET NULL,
    buyer_id    INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    seller_id   INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size        VARCHAR(10)   NOT NULL,
    price       DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status      VARCHAR(30)   NOT NULL DEFAULT 'pending_shipment'
                CHECK (status IN (
                    'pending_shipment',
                    'shipped_to_verify',
                    'verifying',
                    'verified_passed',
                    'verified_failed',
                    'shipped_to_buyer',
                    'completed',
                    'cancelled'
                )),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer  ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_product_time ON transactions(product_id, created_at DESC);

-- =====================================================================
-- 7. verifications  (xac thuc san pham bang Trung tam Xac thuc)
-- =====================================================================
CREATE TABLE verifications (
    id             SERIAL      PRIMARY KEY,
    transaction_id INT         NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    admin_id       INT         REFERENCES users(id) ON DELETE SET NULL,
    result         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (result IN ('pending', 'passed', 'failed')),
    notes          TEXT,
    verified_at    TIMESTAMP
);

-- =====================================================================
-- 8. seller_ratings  (Buyer danh gia Seller sau khi completed)
-- =====================================================================
CREATE TABLE seller_ratings (
    id             SERIAL    PRIMARY KEY,
    transaction_id INT       NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    buyer_id       INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id      INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating         INT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_ratings_seller ON seller_ratings(seller_id);

-- =====================================================================
-- 9. follows  (wishlist / theo doi san pham)
-- =====================================================================
CREATE TABLE follows (
    id         SERIAL    PRIMARY KEY,
    user_id    INT       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id INT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =====================================================================
-- 10. order_status_logs  (audit trail trang thai don hang)
-- =====================================================================
CREATE TABLE order_status_logs (
    id             SERIAL      PRIMARY KEY,
    transaction_id INT         NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    old_status     VARCHAR(30),
    new_status     VARCHAR(30) NOT NULL,
    changed_by     INT         REFERENCES users(id) ON DELETE SET NULL,
    note           TEXT,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_logs_transaction ON order_status_logs(transaction_id);

-- =====================================================================
-- 11. notifications  (thong bao cho user - Week 7)
-- =====================================================================
CREATE TABLE notifications (
    id          SERIAL       PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    type        VARCHAR(40)  NOT NULL DEFAULT 'info',
    product_id  INT          REFERENCES products(id) ON DELETE CASCADE,
    message     TEXT         NOT NULL,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =====================================================================
-- 12. user_events  (GR2 — implicit feedback cho he goi y)
--   user_id NULL = khach chua dang nhap, dinh danh bang session_id.
--   Bid/Ask/Follow/Transaction da co bang rieng; bang nay ghi cac hanh vi
--   khong de lai dau vet o noi khac: xem trang (kem thoi gian xem), tim kiem,
--   click vao goi y.
-- =====================================================================
CREATE TABLE user_events (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        INT          REFERENCES users(id)    ON DELETE CASCADE,
    session_id     VARCHAR(64),
    product_id     INT          REFERENCES products(id) ON DELETE CASCADE,
    event_type     VARCHAR(20)  NOT NULL
                   CHECK (event_type IN ('view', 'search', 'rec_click')),
    query          VARCHAR(200),
    dwell_ms       INT          CHECK (dwell_ms IS NULL OR dwell_ms >= 0),
    source         VARCHAR(40),
    rec_request_id VARCHAR(64),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_events_user    ON user_events(user_id, created_at DESC);
CREATE INDEX idx_user_events_session ON user_events(session_id, created_at DESC);
CREATE INDEX idx_user_events_product ON user_events(product_id, event_type, created_at DESC);
