/*
  # Fix RLS policies for products and skus tables

  1. Changes
    - Drop existing RLS policies
    - Create new, properly configured RLS policies for products and skus tables
    
  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Anonymous users to insert data (needed for seeding)
      - Authenticated users to insert data
      - All users to read data
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

CREATE POLICY "Enable insert for authenticated users" 
ON "public"."products"
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users" 
ON "public"."products"
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create new policies for skus table
CREATE POLICY "Enable read access for all users" 
ON "public"."skus"
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON "public"."skus"
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users" 
ON "public"."skus"
FOR INSERT 
TO anon 
WITH CHECK (true);