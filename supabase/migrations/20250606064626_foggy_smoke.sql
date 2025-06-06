/*
  # Update RLS policies for data seeding

  1. Changes
    - Add policies to allow anonymous users to insert data into products and skus tables
    - This is necessary for initial data seeding during development
    
  2. Security
    - Maintains existing authenticated user policies
    - Adds new policies for anonymous users
    - Only affects INSERT operations
*/

-- Add policy for anonymous users to insert products
CREATE POLICY "Allow insert access to anonymous users for products"
ON public.products
FOR INSERT
TO anon
WITH CHECK (true);

-- Add policy for anonymous users to insert SKUs
CREATE POLICY "Allow insert access to anonymous users for skus"
ON public.skus
FOR INSERT
TO anon
WITH CHECK (true);