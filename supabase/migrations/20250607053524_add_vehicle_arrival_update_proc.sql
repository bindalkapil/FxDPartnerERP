/*
  # Add Vehicle Arrival Update Procedure

  1. Changes
    - Create a stored procedure to handle atomic updates of vehicle arrival status and final quantities
    - Ensure both updates happen in a single transaction
    - Validate input data before updates
*/

-- Create the stored procedure
CREATE OR REPLACE FUNCTION update_vehicle_arrival_with_final_quantities(
  p_arrival_id uuid,
  p_status text,
  p_updates jsonb DEFAULT '{}'::jsonb,
  p_final_quantities jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_arrival vehicle_arrivals;
  v_item vehicle_arrival_items;
  v_final_quantity jsonb;
  v_result jsonb;
BEGIN
  -- Start transaction
  BEGIN
    -- Update vehicle arrival status
    UPDATE vehicle_arrivals
    SET 
      status = p_status,
      notes = COALESCE((p_updates->>'notes')::text, notes),
      updated_at = now()
    WHERE id = p_arrival_id
    RETURNING * INTO v_arrival;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vehicle arrival not found: %', p_arrival_id;
    END IF;

    -- If marking as completed and final quantities provided, update them
    IF p_status = 'completed' AND jsonb_array_length(p_final_quantities) > 0 THEN
      FOR v_final_quantity IN SELECT * FROM jsonb_array_elements(p_final_quantities)
      LOOP
        -- Update item with final quantity
        UPDATE vehicle_arrival_items
        SET 
          final_quantity = (v_final_quantity->>'final_quantity')::numeric,
          final_total_weight = (v_final_quantity->>'final_total_weight')::numeric,
          updated_at = now()
        WHERE 
          id = (v_final_quantity->>'item_id')::uuid
          AND vehicle_arrival_id = p_arrival_id
        RETURNING * INTO v_item;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Vehicle arrival item not found: % for arrival %', 
            v_final_quantity->>'item_id', p_arrival_id;
        END IF;
      END LOOP;
    END IF;

    -- Get updated arrival data with items
    SELECT jsonb_build_object(
      'arrival', row_to_json(v_arrival),
      'items', (
        SELECT jsonb_agg(row_to_json(i))
        FROM vehicle_arrival_items i
        WHERE i.vehicle_arrival_id = p_arrival_id
      )
    ) INTO v_result;

    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_vehicle_arrival_with_final_quantities TO authenticated; 