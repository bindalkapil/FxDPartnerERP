/*
  # Add Final Quantities to Vehicle Arrival Items

  1. Changes
    - Add final_quantity and final_total_weight columns to vehicle_arrival_items
    - These columns will store the actual quantities after unloading
    - Default values will be same as original quantities
*/

-- Add new columns
ALTER TABLE vehicle_arrival_items
ADD COLUMN final_quantity numeric,
ADD COLUMN final_total_weight numeric;

-- Update existing records to have final quantities same as original
UPDATE vehicle_arrival_items
SET 
  final_quantity = quantity,
  final_total_weight = total_weight;

-- Make the columns NOT NULL after setting default values
ALTER TABLE vehicle_arrival_items
ALTER COLUMN final_quantity,
ALTER COLUMN final_total_weight;

-- Add check constraint to ensure final quantities are not negative
ALTER TABLE vehicle_arrival_items
ADD CONSTRAINT vehicle_arrival_items_final_quantities_check
CHECK (final_quantity >= 0 AND final_total_weight >= 0); 