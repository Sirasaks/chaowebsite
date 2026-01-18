CREATE INDEX idx_shops_owner_id ON shops (owner_id);

CREATE INDEX idx_master_orders_shop_id ON master_orders (shop_id);

CREATE INDEX idx_orders_shop_id ON orders (shop_id);