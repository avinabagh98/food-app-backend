-- food-delivery-app Seed Data
-- This script populates the database with initial operational data.

-- -----------------------------------------------------------------------------
-- 1. Administrator Account
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO users (id, name, phone, email, role, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'System Admin',
  '+919999999999',
  'admin@food-delivery-app.com',
  'admin',
  1
);

-- -----------------------------------------------------------------------------
-- 2. User Addresses
-- -----------------------------------------------------------------------------
-- Seed addresses for the system admin
INSERT INTO user_addresses (user_id, label, address_details, latitude, longitude, is_default) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Home', '123 Admin Lane, Tech City, 560001', 12.9715987, 77.5945627, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Office', 'food-delivery-app HQ, Silicon Valley, 560002', 12.9715987, 77.5945627, 0);

-- Insert restaurant seed
INSERT INTO restaurant_details (id, name, phone, address_details, latitude, longitude, delivery_radius_km)
VALUES (1, 'food-delivery-app Main Branch', '+919999999999', '123 Food Street, Tech City, 560001', 12.9715987, 77.5945627, 10.00)
ON DUPLICATE KEY UPDATE name=VALUES(name);


-- -----------------------------------------------------------------------------
-- 3. Food Categories
-- -----------------------------------------------------------------------------
-- Using INSERT ... SELECT to ensure idempotency since categories lack a unique constraint on name
INSERT INTO categories (name, description, sort_order, is_active)
SELECT 'Starters', 'Quick bites to start your meal', 1, 1 FROM (SELECT 1) AS tmp WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Starters');

INSERT INTO categories (name, description, sort_order, is_active)
SELECT 'Main Course', 'Hearty and filling main dishes', 2, 1 FROM (SELECT 1) AS tmp WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Main Course');

INSERT INTO categories (name, description, sort_order, is_active)
SELECT 'Desserts', 'Sweet treats to end on a high note', 3, 1 FROM (SELECT 1) AS tmp WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Desserts');

INSERT INTO categories (name, description, sort_order, is_active)
SELECT 'Beverages', 'Refreshing drinks and shakes', 4, 1 FROM (SELECT 1) AS tmp WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Beverages');

-- Store the generated category IDs in variables for use in menu_items
SET @cat_starters = (SELECT id FROM categories WHERE name = 'Starters' LIMIT 1);
SET @cat_main = (SELECT id FROM categories WHERE name = 'Main Course' LIMIT 1);
SET @cat_desserts = (SELECT id FROM categories WHERE name = 'Desserts' LIMIT 1);
SET @cat_beverages = (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1);

-- -----------------------------------------------------------------------------
-- 3. Menu Items
-- -----------------------------------------------------------------------------
-- Note: UUIDs are generated for user-facing entities as per project rules.

INSERT IGNORE INTO menu_items
(id, category_id, name, description, price, image_path, is_available, stock_quantity, is_veg)
VALUES
-- Starters
('b1f2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', @cat_starters, 'Veg Spring Rolls', 'Crispy rolls filled with mixed vegetables', 120.00, 'uploads/spring_rolls.jpg', 1, NULL, 1),
('c2f3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', @cat_starters, 'Chicken Wings', 'Spicy buffalo wings with dip', 250.00, 'uploads/wings.jpg', 1, 20, 0),

-- Main Course
('d3e4f5a6-b7c8-4c7d-0e1f-2a3b4c5d6e7f', @cat_main, 'Paneer Butter Masala', 'Creamy cottage cheese in tomato gravy', 320.00, 'uploads/paneer.jpg', 1, NULL, 1),
('e4f5a6b7-c8d9-4d8e-1f2a-3b4c5d6e7f8a', @cat_main, 'Butter Chicken', 'Tender chicken in a rich buttery sauce', 450.00, 'uploads/butter_chicken.jpg', 1, 15, 0),

-- Desserts
('f5a6b7c8-d9e0-4e9f-2a3b-4c5d6e7f8a9b', @cat_desserts, 'Gulab Jamun', 'Warm milk dumplings in syrup', 100.00, 'uploads/gulab_jamun.jpg', 1, NULL, 1),
('a6b7c8d9-e0f1-4f0a-3b4c-5d6e7f8a9b0c', @cat_desserts, 'Chocolate Lava Cake', 'Molten chocolate center cake', 180.00, 'uploads/lava_cake.jpg', 1, 10, 1),

-- Beverages
('b7c8d9e0-f1a2-401b-4c5d-6e7f8a9b0c1d', @cat_beverages, 'Mango Lassi', 'Traditional yogurt drink with mango', 80.00, 'uploads/lassi.jpg', 1, NULL, 1),
('c8d9e0f1-a2b3-412c-5d6e-7f8a9b0c1d2e', @cat_beverages, 'Iced Coffee', 'Cold brewed coffee with milk', 120.00, 'uploads/iced_coffee.jpg', 1, 30, 1);
