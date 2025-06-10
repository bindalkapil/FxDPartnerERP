/*
  # Create sales tables

  1. New Tables
    - `sales_orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `customer_id` (uuid, foreign key to customers)
      - `order_date` (timestamp)
      - `delivery_date` (timestamp, optional)
      - `delivery_address` (text, optional)
      - `payment_terms` (integer, default 30)
      - `payment_mode` (text: cash, credit, bank_transfer, upi)
      - `payment_status` (text: paid, partial, unpaid)
      - `subtotal` (numeric, default 0)
      - `tax_amount` (numeric, default 0)
      - `discount_amount` (numeric, default 0)
      - `total_amount` (numeric, default 0)
      - `status` (text: draft, confirmed, processing, dispatched, delivered, cancelled)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sales_order_items`
      - `id` (uuid, primary key)
      - `sales_order_id` (uuid, foreign key to sales_orders)
      - `product_id` (uuid, foreign key to products)
      - `sku_id` (uuid, foreign key to skus)
      - `product_name` (text)
      - `sku_code` (text)
      - `quantity` (numeric)
      - `unit_type` (text)
      - `unit_price` (numeric)
      - `total_price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (matching existing pattern)
*/

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  order_date timestamptz NOT NULL DEFAULT now(),
  delivery_date timestamptz,
  delivery_address text,
  payment_terms integer DEFAULT 30,
  payment_mode text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'unpaid',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  sku_id uuid NOT NULL REFERENCES skus(id),
  product_name text NOT NULL,
  sku_code text NOT NULL,
  quantity numeric NOT NULL,
  unit_type text NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_payment_mode_check 
  CHECK (payment_mode = ANY (ARRAY['cash'::text, 'credit'::text, 'bank_transfer'::text, 'upi'::text]));

ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_payment_status_check 
  CHECK (payment_status = ANY (ARRAY['paid'::text, 'partial'::text, 'unpaid'::text]));

ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check 
  CHECK (status = ANY (ARRAY['draft'::text, 'processing'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_quantity_check 
  CHECK (quantity > 0);

ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_unit_price_check 
  CHECK (unit_price >= 0);

ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_total_price_check 
  CHECK (total_price >= 0);

ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_unit_type_check 
  CHECK (unit_type = ANY (ARRAY['box'::text, 'loose'::text]));

-- Create indexes
CREATE INDEX IF NOT EXISTS sales_orders_customer_id_idx ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS sales_orders_order_date_idx ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS sales_orders_status_idx ON sales_orders(status);
CREATE INDEX IF NOT EXISTS sales_orders_payment_status_idx ON sales_orders(payment_status);
CREATE INDEX IF NOT EXISTS sales_order_items_sales_order_id_idx ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS sales_order_items_product_id_idx ON sales_order_items(product_id);
CREATE INDEX IF NOT EXISTS sales_order_items_sku_id_idx ON sales_order_items(sku_id);

-- Enable RLS
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for sales_orders
CREATE POLICY "sales_orders_allow_public_select" ON sales_orders
  FOR SELECT TO public USING (true);

CREATE POLICY "sales_orders_allow_public_insert" ON sales_orders
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "sales_orders_allow_public_update" ON sales_orders
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "sales_orders_allow_public_delete" ON sales_orders
  FOR DELETE TO public USING (true);

-- Create policies for sales_order_items
CREATE POLICY "sales_order_items_allow_public_select" ON sales_order_items
  FOR SELECT TO public USING (true);

CREATE POLICY "sales_order_items_allow_public_insert" ON sales_order_items
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "sales_order_items_allow_public_update" ON sales_order_items
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "sales_order_items_allow_public_delete" ON sales_order_items
  FOR DELETE TO public USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_sales_orders_updated_at 
  BEFORE UPDATE ON sales_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_order_items_updated_at 
  BEFORE UPDATE ON sales_order_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();