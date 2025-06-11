-- Create current_inventory table
CREATE TABLE IF NOT EXISTS current_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    sku_id UUID NOT NULL REFERENCES skus(id),
    product_name TEXT NOT NULL,
    sku_code TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('box', 'loose')),
    available_quantity NUMERIC NOT NULL DEFAULT 0,
    total_weight NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, sku_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_current_inventory_product_id ON current_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_current_inventory_sku_id ON current_inventory(sku_id);
CREATE INDEX IF NOT EXISTS idx_current_inventory_category ON current_inventory(category);
CREATE INDEX IF NOT EXISTS idx_current_inventory_sku_code ON current_inventory(sku_code);

-- Enable Row Level Security
ALTER TABLE current_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON current_inventory
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON current_inventory
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON current_inventory
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create function to update last_updated_at
CREATE OR REPLACE FUNCTION update_current_inventory_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_updated_at
CREATE TRIGGER update_current_inventory_last_updated_at
    BEFORE UPDATE ON current_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_current_inventory_last_updated_at();

-- Create function to update inventory after vehicle arrival
CREATE OR REPLACE FUNCTION update_inventory_after_vehicle_arrival()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update inventory when vehicle arrival is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update inventory for each item
        FOR item IN 
            SELECT 
                vai.product_id,
                vai.sku_id,
                p.name as product_name,
                s.code as sku_code,
                p.category,
                vai.unit_type,
                vai.final_quantity,
                vai.final_total_weight
            FROM vehicle_arrival_items vai
            JOIN products p ON p.id = vai.product_id
            JOIN skus s ON s.id = vai.sku_id
            WHERE vai.vehicle_arrival_id = NEW.id
        LOOP
            INSERT INTO current_inventory (
                product_id,
                sku_id,
                product_name,
                sku_code,
                category,
                unit_type,
                available_quantity,
                total_weight
            )
            VALUES (
                item.product_id,
                item.sku_id,
                item.product_name,
                item.sku_code,
                item.category,
                item.unit_type,
                item.final_quantity,
                item.final_total_weight
            )
            ON CONFLICT (product_id, sku_id) DO UPDATE
            SET 
                available_quantity = current_inventory.available_quantity + item.final_quantity,
                total_weight = current_inventory.total_weight + item.final_total_weight,
                updated_at = NOW();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update inventory after vehicle arrival
CREATE TRIGGER update_inventory_after_vehicle_arrival
    AFTER UPDATE ON vehicle_arrivals
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_after_vehicle_arrival();

-- Create function to update inventory after sales order
CREATE OR REPLACE FUNCTION update_inventory_after_sales_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update inventory when sales order is created or cancelled
    IF (TG_OP = 'INSERT' AND NEW.status != 'cancelled') OR
       (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        -- Update inventory for each item
        FOR item IN 
            SELECT 
                soi.product_id,
                soi.sku_id,
                soi.quantity
            FROM sales_order_items soi
            WHERE soi.sales_order_id = NEW.id
        LOOP
            UPDATE current_inventory
            SET 
                available_quantity = CASE 
                    WHEN TG_OP = 'INSERT' THEN available_quantity - item.quantity
                    ELSE available_quantity + item.quantity
                END,
                updated_at = NOW()
            WHERE product_id = item.product_id AND sku_id = item.sku_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update inventory after sales order
CREATE TRIGGER update_inventory_after_sales_order
    AFTER INSERT OR UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_after_sales_order();

-- Initialize current inventory from existing data
WITH completed_arrivals AS (
    SELECT 
        vai.product_id,
        vai.sku_id,
        p.name as product_name,
        s.code as sku_code,
        p.category,
        vai.unit_type,
        SUM(vai.final_quantity) as total_quantity,
        SUM(vai.final_total_weight) as total_weight
    FROM vehicle_arrivals va
    JOIN vehicle_arrival_items vai ON vai.vehicle_arrival_id = va.id
    JOIN products p ON p.id = vai.product_id
    JOIN skus s ON s.id = vai.sku_id
    WHERE va.status = 'completed'
    GROUP BY vai.product_id, vai.sku_id, p.name, s.code, p.category, vai.unit_type
),
sold_quantities AS (
    SELECT 
        soi.product_id,
        soi.sku_id,
        SUM(soi.quantity) as sold_quantity
    FROM sales_orders so
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    WHERE so.status != 'cancelled'
    GROUP BY soi.product_id, soi.sku_id
)
INSERT INTO current_inventory (
    product_id,
    sku_id,
    product_name,
    sku_code,
    category,
    unit_type,
    available_quantity,
    total_weight
)
SELECT 
    ca.product_id,
    ca.sku_id,
    ca.product_name,
    ca.sku_code,
    ca.category,
    ca.unit_type,
    COALESCE(ca.total_quantity, 0) - COALESCE(sq.sold_quantity, 0) as available_quantity,
    ca.total_weight
FROM completed_arrivals ca
LEFT JOIN sold_quantities sq ON sq.product_id = ca.product_id AND sq.sku_id = ca.sku_id
ON CONFLICT (product_id, sku_id) DO UPDATE
SET 
    available_quantity = EXCLUDED.available_quantity,
    total_weight = EXCLUDED.total_weight,
    updated_at = NOW(); 