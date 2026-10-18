-- =====================================================================
-- SneakickS — Seed Data (GR2)
-- Chay sau schema.sql. Idempotent: dung TRUNCATE ... RESTART IDENTITY.
-- San pham (~340) duoc sinh boi src/db/catalog.js va chen trong migrate.js.
-- Users duoc chen qua bcrypt trong migrate.js.
-- =====================================================================

TRUNCATE
    user_events,
    notifications,
    order_status_logs,
    follows,
    seller_ratings,
    verifications,
    transactions,
    bids,
    asks,
    products,
    categories,
    users
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------
-- categories  (4 danh muc)
-- ---------------------------------------------------------------------
INSERT INTO categories (name, description) VALUES
    ('Sneakers',     'Sneakers and limited-edition footwear'),
    ('Apparel',      'Streetwear apparel'),
    ('Accessories',  'Fashion accessories'),
    ('Collectibles', 'Collectible items');
