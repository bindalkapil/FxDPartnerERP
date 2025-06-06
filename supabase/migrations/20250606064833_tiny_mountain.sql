/*
  # Update RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies with unique names for products and skus tables
    - Enable full read/write access for seeding

  2. Security
    - Maintains RLS protection while enabling required functionality
    - Allows both anonymous and authenticated users to read/write data
*/

-- Drop existing policies for products
DROP POLICY IF EXISTS "Allow insert access to all authenticated users for products" ON "public"."products";
DROP POLICY IF EXISTS "Allow insert access to anonymous users for products" ON "public"."products";
DROP POLICY IF EXISTS "Allow read access to all authenticated users for products" ON "public"."products";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable insert access for all users" ON "public"."products";

-- Drop existing policies for skus
DROP POLICY IF EXISTS "Allow insert access to all authenticated users for skus" ON "public"."skus";
DROP POLICY IF EXISTS "Allow insert access to anonymous users for skus" ON "public"."skus";
DROP POLICY IF EXISTS "Allow read access to all authenticated users for skus" ON "public"."skus";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."skus";
DROP POLICY IF EXISTS "Enable insert access for all users" ON "public"."skus";

-- Create new policies for products table with unique names
CREATE POLICY "products_allow_public_select" 
ON "public"."products"
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "products_allow_public_insert" 
ON "public"."products"
FOR INSERT 
TO public 
WITH CHECK (true);

-- Create new policies for skus table with unique names
CREATE POLICY "skus_allow_public_select" 
ON "public"."skus"
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "skus_allow_public_insert" 
ON "public"."skus"
FOR INSERT 
TO public 
WITH CHECK (true);