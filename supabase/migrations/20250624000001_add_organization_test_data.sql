-- Add test data for different organizations

-- Get organization IDs
DO $$
DECLARE
    default_org_id UUID;
    fxd_org_id UUID;
BEGIN
    -- Get the default organization ID
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
    
    -- Create FxD Fruits Ltd organization if it doesn't exist
    INSERT INTO organizations (name, slug, status) 
    VALUES ('FxD Fruits Ltd', 'fxd-fruits', 'active')
    ON CONFLICT (slug) DO NOTHING;
    
    SELECT id INTO fxd_org_id FROM organizations WHERE slug = 'fxd-fruits';
    
    -- Add different products for each organization
    IF default_org_id IS NOT NULL THEN
        -- Default Organization Products
        INSERT INTO products (name, category, description, status, organization_id) VALUES
        ('Apple', 'Fruits', 'Fresh red apples', 'active', default_org_id),
        ('Banana', 'Fruits', 'Yellow bananas', 'active', default_org_id),
        ('Orange', 'Fruits', 'Juicy oranges', 'active', default_org_id)
        ON CONFLICT DO NOTHING;
        
        -- Default Organization Customers
        INSERT INTO customers (name, customer_type, contact, email, address, credit_limit, current_balance, payment_terms, status, organization_id) VALUES
        ('ABC Retail Store', 'retailer', '+91-9876543210', 'abc@retail.com', '123 Market Street, Delhi', 50000, 15000, 30, 'active', default_org_id),
        ('XYZ Supermarket', 'wholesaler', '+91-9876543211', 'xyz@supermarket.com', '456 Shopping Complex, Mumbai', 75000, 25000, 15, 'active', default_org_id),
        ('John Doe', 'other', '+91-9876543212', 'john@email.com', '789 Residential Area, Bangalore', 10000, 2500, 7, 'active', default_org_id)
        ON CONFLICT DO NOTHING;
        
        -- Default Organization Suppliers
        INSERT INTO suppliers (company_name, contact_person, phone, email, address, payment_terms, credit_limit, current_balance, status, organization_id) VALUES
        ('Fresh Farm Supplies', 'Raj Kumar', '+91-9876543220', 'raj@freshfarm.com', 'Farm Road, Punjab', 30, 100000, 35000, 'active', default_org_id),
        ('Organic Produce Co', 'Priya Sharma', '+91-9876543221', 'priya@organic.com', 'Green Valley, Kerala', 15, 80000, 20000, 'active', default_org_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF fxd_org_id IS NOT NULL THEN
        -- FxD Fruits Ltd Products (different products)
        INSERT INTO products (name, category, description, status, organization_id) VALUES
        ('Mango', 'Fruits', 'Sweet mangoes', 'active', fxd_org_id),
        ('Grapes', 'Fruits', 'Fresh grapes', 'active', fxd_org_id),
        ('Pineapple', 'Fruits', 'Tropical pineapples', 'active', fxd_org_id),
        ('Watermelon', 'Fruits', 'Juicy watermelons', 'active', fxd_org_id)
        ON CONFLICT DO NOTHING;
        
        -- FxD Fruits Ltd Customers (different customers)
        INSERT INTO customers (name, customer_type, contact, email, address, credit_limit, current_balance, payment_terms, status, organization_id) VALUES
        ('Premium Fruits Market', 'restaurant', '+91-8765432100', 'premium@fruits.com', '100 Premium Plaza, Chennai', 100000, 45000, 30, 'active', fxd_org_id),
        ('Tropical Store', 'wholesaler', '+91-8765432101', 'tropical@store.com', '200 Tropical Street, Goa', 60000, 18000, 15, 'active', fxd_org_id),
        ('Sarah Wilson', 'retailer', '+91-8765432102', 'sarah@email.com', '300 Garden View, Pune', 15000, 5000, 7, 'active', fxd_org_id)
        ON CONFLICT DO NOTHING;
        
        -- FxD Fruits Ltd Suppliers (different suppliers)
        INSERT INTO suppliers (company_name, contact_person, phone, email, address, payment_terms, credit_limit, current_balance, status, organization_id) VALUES
        ('Tropical Farms Ltd', 'Amit Patel', '+91-8765432110', 'amit@tropical.com', 'Coastal Road, Maharashtra', 30, 120000, 50000, 'active', fxd_org_id),
        ('Exotic Fruit Growers', 'Meera Singh', '+91-8765432111', 'meera@exotic.com', 'Hill Station, Himachal', 15, 90000, 30000, 'active', fxd_org_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add some sample inventory for each organization
    -- Note: We'll add SKUs and inventory in a separate step since we need product IDs
    
END $$;

-- Add SKUs and inventory for Default Organization
DO $$
DECLARE
    default_org_id UUID;
    apple_id UUID;
    banana_id UUID;
    orange_id UUID;
    apple_sku_id UUID;
    banana_sku_id UUID;
    orange_sku_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
    
    IF default_org_id IS NOT NULL THEN
        -- Get product IDs for default organization
        SELECT id INTO apple_id FROM products WHERE name = 'Apple' AND organization_id = default_org_id;
        SELECT id INTO banana_id FROM products WHERE name = 'Banana' AND organization_id = default_org_id;
        SELECT id INTO orange_id FROM products WHERE name = 'Orange' AND organization_id = default_org_id;
        
        -- Add SKUs for default organization
        IF apple_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (apple_id, 'APL-BOX-5KG', 'box', 5.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO apple_sku_id;
            
            IF apple_sku_id IS NULL THEN
                SELECT id INTO apple_sku_id FROM skus WHERE code = 'APL-BOX-5KG';
            END IF;
            
            -- Add inventory
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (apple_id, apple_sku_id, 'Apple', 'APL-BOX-5KG', 'Fruits', 'box', 150, 750.0, default_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
        
        IF banana_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (banana_id, 'BAN-BOX-10KG', 'box', 10.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO banana_sku_id;
            
            IF banana_sku_id IS NULL THEN
                SELECT id INTO banana_sku_id FROM skus WHERE code = 'BAN-BOX-10KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (banana_id, banana_sku_id, 'Banana', 'BAN-BOX-10KG', 'Fruits', 'box', 200, 2000.0, default_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
        
        IF orange_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (orange_id, 'ORG-BOX-8KG', 'box', 8.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO orange_sku_id;
            
            IF orange_sku_id IS NULL THEN
                SELECT id INTO orange_sku_id FROM skus WHERE code = 'ORG-BOX-8KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (orange_id, orange_sku_id, 'Orange', 'ORG-BOX-8KG', 'Fruits', 'box', 100, 800.0, default_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Add SKUs and inventory for FxD Fruits Ltd
DO $$
DECLARE
    fxd_org_id UUID;
    mango_id UUID;
    grapes_id UUID;
    pineapple_id UUID;
    watermelon_id UUID;
    mango_sku_id UUID;
    grapes_sku_id UUID;
    pineapple_sku_id UUID;
    watermelon_sku_id UUID;
BEGIN
    SELECT id INTO fxd_org_id FROM organizations WHERE slug = 'fxd-fruits';
    
    IF fxd_org_id IS NOT NULL THEN
        -- Get product IDs for FxD organization
        SELECT id INTO mango_id FROM products WHERE name = 'Mango' AND organization_id = fxd_org_id;
        SELECT id INTO grapes_id FROM products WHERE name = 'Grapes' AND organization_id = fxd_org_id;
        SELECT id INTO pineapple_id FROM products WHERE name = 'Pineapple' AND organization_id = fxd_org_id;
        SELECT id INTO watermelon_id FROM products WHERE name = 'Watermelon' AND organization_id = fxd_org_id;
        
        -- Add SKUs for FxD organization
        IF mango_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (mango_id, 'MNG-BOX-6KG', 'box', 6.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO mango_sku_id;
            
            IF mango_sku_id IS NULL THEN
                SELECT id INTO mango_sku_id FROM skus WHERE code = 'MNG-BOX-6KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (mango_id, mango_sku_id, 'Mango', 'MNG-BOX-6KG', 'Fruits', 'box', 80, 480.0, fxd_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
        
        IF grapes_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (grapes_id, 'GRP-BOX-4KG', 'box', 4.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO grapes_sku_id;
            
            IF grapes_sku_id IS NULL THEN
                SELECT id INTO grapes_sku_id FROM skus WHERE code = 'GRP-BOX-4KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (grapes_id, grapes_sku_id, 'Grapes', 'GRP-BOX-4KG', 'Fruits', 'box', 120, 480.0, fxd_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
        
        IF pineapple_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (pineapple_id, 'PIN-BOX-12KG', 'box', 12.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO pineapple_sku_id;
            
            IF pineapple_sku_id IS NULL THEN
                SELECT id INTO pineapple_sku_id FROM skus WHERE code = 'PIN-BOX-12KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (pineapple_id, pineapple_sku_id, 'Pineapple', 'PIN-BOX-12KG', 'Fruits', 'box', 60, 720.0, fxd_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
        
        IF watermelon_id IS NOT NULL THEN
            INSERT INTO skus (product_id, code, unit_type, unit_weight, status) VALUES
            (watermelon_id, 'WTM-BOX-15KG', 'box', 15.0, 'active')
            ON CONFLICT (code) DO NOTHING
            RETURNING id INTO watermelon_sku_id;
            
            IF watermelon_sku_id IS NULL THEN
                SELECT id INTO watermelon_sku_id FROM skus WHERE code = 'WTM-BOX-15KG';
            END IF;
            
            INSERT INTO current_inventory (product_id, sku_id, product_name, sku_code, category, unit_type, available_quantity, total_weight, organization_id) VALUES
            (watermelon_id, watermelon_sku_id, 'Watermelon', 'WTM-BOX-15KG', 'Fruits', 'box', 40, 600.0, fxd_org_id)
            ON CONFLICT (product_id, sku_id) DO NOTHING;
        END IF;
    END IF;
END $$;
