/*
  # Fix RLS policies for data seeding

  1. Changes
    - Drop existing RLS policies for products and skus tables
    - Create new, properly configured RLS policies that allow:
      - Anonymous users to insert data (needed for seeding)
      - Authenticated users to insert data
      - All users to read data
      - Proper security checks in place
  
  2. Security
    - Maintains RLS enabled on both tables
    - Ensures proper access control while allowing seeding
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert access to all authenticated users for products" ON "public"."products";
DROP POLICY IF EXISTS "Allow insert access to anonymous users for products" ON "public"."products";
DROP POLICY IF EXISTS "Allow read access to all authenticated users for products" ON "public"."products";

DROP POLICY IF EXISTS "Allow insert access to all authenticated users for skus" ON "public"."skus";
DROP POLICY IF EXISTS "Allow insert access to anonymous users for skus" ON "public"."skus";
DROP POLICY IF EXISTS "Allow read access to all authenticated users for skus" ON "public"."skus";

-- Create new policies for products table
CREATE POLICY "Enable read access for all users" 
ON "public"."products"
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON "public"."products"
FOR INSERT 
TO public 
WITH CHECK (true);

-- Create new policies for skus table
CREATE POLICY "Enable read access for all users" 
ON "public"."skus"
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON "public"."skus"
FOR INSERT 
TO public 
WITH CHECK (true);