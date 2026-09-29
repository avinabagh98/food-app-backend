-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL UNIQUE,
  email      VARCHAR(100) DEFAULT NULL,
  role       ENUM('customer','admin','manager','rider') NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 2: user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id              INT          PRIMARY KEY AUTO_INCREMENT,
  user_id         CHAR(36)     NOT NULL,
  label           VARCHAR(50)  NOT NULL,
  address_details TEXT         NOT NULL,
  latitude        DECIMAL(10,7) NOT NULL,
  longitude       DECIMAL(10,7) NOT NULL,
  is_default      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_default (user_id, is_default)
);

-- Table 3: otp_verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  phone      VARCHAR(20)  NOT NULL,
  otp_code   VARCHAR(6)   NOT NULL,
  expires_at DATETIME     NOT NULL,
  is_used    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone_created (phone, created_at)
);

-- Table 4: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT         PRIMARY KEY AUTO_INCREMENT,
  user_id    CHAR(36)    NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME    NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table 5: categories
CREATE TABLE IF NOT EXISTS categories (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT         DEFAULT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 6: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id             CHAR(36)       PRIMARY KEY,
  category_id    INT            NOT NULL,
  name           VARCHAR(150)   NOT NULL,
  description    TEXT           DEFAULT NULL,
  price          DECIMAL(10,2)  NOT NULL,
  image_path     VARCHAR(255)   DEFAULT NULL,
  is_available   TINYINT(1)     NOT NULL DEFAULT 1,
  stock_quantity INT            DEFAULT NULL,
  is_veg         TINYINT(1)     NOT NULL DEFAULT 0,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Table 7: carts
CREATE TABLE IF NOT EXISTS carts (
  id         INT      PRIMARY KEY AUTO_INCREMENT,
  user_id    CHAR(36) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table 8: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  cart_id       INT           NOT NULL,
  menu_item_id  CHAR(36)      NOT NULL,
  quantity      INT           NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_item (cart_id, menu_item_id),
  FOREIGN KEY (cart_id)      REFERENCES carts(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Table 9: orders
CREATE TABLE IF NOT EXISTS orders (
  id                   CHAR(36)      PRIMARY KEY,
  user_id              CHAR(36)      NOT NULL,
  status               ENUM('PENDING','CONFIRMED','PREPARING','READY_FOR_PICKUP',
                            'OUT_FOR_DELIVERY','DELIVERED','REJECTED','CANCELLED')
                                     NOT NULL DEFAULT 'PENDING',
  delivery_address     TEXT          NOT NULL,
  subtotal             DECIMAL(10,2) NOT NULL,
  tax_amount           DECIMAL(10,2) NOT NULL,
  delivery_fee         DECIMAL(10,2) NOT NULL,
  total_amount         DECIMAL(10,2) NOT NULL,
  special_instructions TEXT          DEFAULT NULL,
  rejection_reason     TEXT          DEFAULT NULL,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table 10: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  order_id      CHAR(36)      NOT NULL,
  menu_item_id  CHAR(36)      NOT NULL,
  name_snapshot VARCHAR(150)  NOT NULL,
  quantity      INT           NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Table 11: rider_assignments
CREATE TABLE IF NOT EXISTS rider_assignments (
  id           INT      PRIMARY KEY AUTO_INCREMENT,
  order_id     CHAR(36) NOT NULL UNIQUE,
  rider_id     CHAR(36) NOT NULL,
  assigned_by  CHAR(36) NOT NULL,
  assigned_at  DATETIME NOT NULL,
  picked_up_at DATETIME DEFAULT NULL,
  delivered_at DATETIME DEFAULT NULL,
  status       ENUM('ASSIGNED','PICKED_UP','DELIVERED') NOT NULL DEFAULT 'ASSIGNED',
  FOREIGN KEY (order_id)    REFERENCES orders(id),
  FOREIGN KEY (rider_id)    REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Table 12: rider_locations
CREATE TABLE IF NOT EXISTS rider_locations (
  id         INT           PRIMARY KEY AUTO_INCREMENT,
  rider_id   CHAR(36)      NOT NULL,
  order_id   CHAR(36)      DEFAULT NULL,
  latitude   DECIMAL(10,7) NOT NULL,
  longitude  DECIMAL(10,7) NOT NULL,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Table 13: restaurant_details
CREATE TABLE IF NOT EXISTS restaurant_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  address_details TEXT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  delivery_radius_km DECIMAL(5,2) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
