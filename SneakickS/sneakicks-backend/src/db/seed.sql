-- =====================================================================
-- SneakickS — Seed Data (Week 4)
-- Chay sau schema.sql. Idempotent: dung TRUNCATE ... RESTART IDENTITY.
-- =====================================================================

TRUNCATE
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

-- ---------------------------------------------------------------------
-- products  (10 san pham mau)
-- ---------------------------------------------------------------------
INSERT INTO products (name, brand, description, image_url, category_id, retail_price) VALUES
    ('Air Jordan 4 Retro Lakers',          'Jordan',     'Lakers-inspired colorway',                  'https://example.com/images/jordan4-lakers.jpg',         1, 285.00),
    ('Yeezy Slide Onyx',                   'Adidas',     'Yeezy Slide in the Onyx colorway',          'https://example.com/images/yeezy-slide-onyx.jpg',       1, 145.00),
    ('Nike Kobe 6 Protro Reverse Grinch',  'Nike',       'Kobe 6 Protro Reverse Grinch edition',      'https://example.com/images/kobe6-reverse-grinch.jpg',   1, 620.00),
    ('Supreme Box Logo Tee White',         'Supreme',    'Supreme Box Logo Tee in white',             'https://example.com/images/supreme-bogo-white.jpg',     2, 110.00),
    ('Essentials Hoodie Dark Oatmeal',     'Fear of God','Fear of God Essentials Hoodie, Dark Oatmeal','https://example.com/images/essentials-hoodie.jpg',     2, 150.00),
    ('Casio G-Shock GA-2100',              'Casio',      'CasiOak GA-2100 standard model',            'https://example.com/images/gshock-ga2100.jpg',          3, 120.00),
    ('New Era NY Yankees Cap',             'New Era',    'New Era 59FIFTY NY Yankees cap',            'https://example.com/images/newera-ny.jpg',              3,  40.00),
    ('POP MART Skullpanda The Warmth',     'POP MART',   'Skullpanda The Warmth blind box',           'https://example.com/images/popmart-skullpanda.jpg',     4,  55.00),
    ('Pokemon Charizard EX Card',          'Pokemon',    'Charizard EX trading card',                 'https://example.com/images/pokemon-charizard.jpg',      4, 320.00),
    ('New Balance 9060 Rain Cloud',        'New Balance','New Balance 9060 Rain Cloud',               'https://example.com/images/nb9060-raincloud.jpg',       1, 230.00);

-- ---------------------------------------------------------------------
-- users  (mat khau plain text de doc cho de — se duoc hash boi migrate.js)
-- Sau khi import xong, migrate.js se UPDATE password_hash bang bcrypt.
-- ---------------------------------------------------------------------
-- NOTE: ham migrate.js se chen users qua bcrypt, KHONG seed o file .sql nay.
-- Phan ngay duoi chi cam de tao Order book mau sau khi co users.
