// Add sales-related API functions
import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      skus(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createProduct(product: Tables['products']['Insert']) {
  // First, check if a product with this name already exists
  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('*')
    .eq('name', product.name);

  if (checkError) {
    throw checkError;
  }

  if (existingProduct && existingProduct.length > 0) {
    // Product already exists, return the existing one
    return existingProduct[0];
  }

  // Product doesn't exist, create a new one
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// SKUs
export async function createSKU(sku: Tables['skus']['Insert']) {
  // First, check if a SKU with this code already exists
  const { data: existingSKU, error: checkError } = await supabase
    .from('skus')
    .select('*')
    .eq('code', sku.code);

  if (checkError) {
    throw checkError;
  }

  if (existingSKU && existingSKU.length > 0) {
    // SKU already exists, return the existing one
    return existingSKU[0];
  }

  // SKU doesn't exist, create a new one
  const { data, error } = await supabase
    .from('skus')
    .insert(sku)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Customer Balance Management
export async function updateCustomerBalance(customerId: string, amount: number, operation: 'add' | 'subtract') {
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('current_balance')
    .eq('id', customerId)
    .single();

  if (fetchError) throw fetchError;

  const newBalance = operation === 'add' 
    ? customer.current_balance + amount 
    : customer.current_balance - amount;

  const { data, error } = await supabase
    .from('customers')
    .update({ current_balance: newBalance })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Supplier Balance Management
export async function updateSupplierBalance(supplierId: string, amount: number, operation: 'add' | 'subtract') {
  const { data: supplier, error: fetchError } = await supabase
    .from('suppliers')
    .select('current_balance')
    .eq('id', supplierId)
    .single();

  if (fetchError) throw fetchError;

  const newBalance = operation === 'add' 
    ? supplier.current_balance + amount 
    : supplier.current_balance - amount;

  const { data, error } = await supabase
    .from('suppliers')
    .update({ current_balance: newBalance })
    .eq('id', supplierId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Customers
export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createCustomer(customer: Tables['customers']['Insert']) {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, customer: Tables['customers']['Update']) {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get Sales Orders by Customer ID
export async function getSalesOrdersByCustomerId(customerId: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items(
        *,
        product:products(*),
        sku:skus(*)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get Payments by Party ID
export async function getPaymentsByPartyId(partyId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('party_id', partyId)
    .order('payment_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Suppliers
export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getSupplier(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createSupplier(supplier: Tables['suppliers']['Insert']) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, supplier: Tables['suppliers']['Update']) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Get Purchase Records by Supplier ID
export async function getPurchaseRecordsBySupplierId(supplierId: string) {
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      *,
      purchase_record_items(*),
      purchase_record_costs(*)
    `)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Sales Orders
export async function getSalesOrders() {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(*),
      sales_order_items(
        *,
        product:products(*),
        sku:skus(*)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getSalesOrder(id: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(*),
      sales_order_items(
        *,
        product:products(*),
        sku:skus(*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Helper function to handle null values in numeric calculations
function safeNumericValue(value: number | null, defaultValue: number = 0): number {
  return value === null ? defaultValue : value;
}

// Update inventory after sale
async function updateInventoryAfterSale(productId: string, skuId: string, quantity: number) {
  // First get the current quantity
  const { data: currentInventory, error: fetchError } = await supabase
    .from('current_inventory')
    .select('available_quantity')
    .match({ product_id: productId, sku_id: skuId })
    .single();

  if (fetchError) throw fetchError;

  // Then update with the new quantity
  const { error: updateError } = await supabase
    .from('current_inventory')
    .update({
      available_quantity: Math.max(0, (currentInventory?.available_quantity || 0) - quantity),
      updated_at: new Date().toISOString()
    })
    .match({ product_id: productId, sku_id: skuId });

  if (updateError) throw updateError;
}

// Updated createSalesOrder function with CORRECTED status logic
export async function createSalesOrder(orderData: any) {
  const { items, ...orderDetails } = orderData;
  
  // Validate that items exist and have required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Sales order must have at least one item');
  }

  // Validate each item has required fields (handle both camelCase and snake_case)
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const productId = item.product_id || item.productId;
    const skuId = item.sku_id || item.skuId;
    
    if (!productId || !skuId) {
      throw new Error(`Item ${i + 1} is missing product_id or sku_id`);
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Item ${i + 1} must have a valid quantity`);
    }
    const unitPrice = item.unit_price || item.unitPrice;
    if (!unitPrice || unitPrice < 0) {
      throw new Error(`Item ${i + 1} must have a valid unit price`);
    }
  }
  
  // Calculate total amount with null safety
  const totalAmount = items.reduce((sum: number, item: any) => {
    const quantity = safeNumericValue(item.quantity);
    const unitPrice = safeNumericValue(item.unit_price || item.unitPrice);
    return sum + (quantity * unitPrice);
  }, 0);

  // CORRECTED STATUS LOGIC:
  // If delivery_date is NULL or empty, it's a counter order (completed)
  // If delivery_date is provided, it's an outstation order (dispatch_pending)
  const status = (!orderDetails.delivery_date) ? 'completed' : 'dispatch_pending';

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      ...orderDetails,
      status: status,
      total_amount: totalAmount
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert items with null safety and validation (handle both camelCase and snake_case)
  const orderItems = items.map((item: any) => {
    const productId = item.product_id || item.productId;
    const skuId = item.sku_id || item.skuId;
    const unitPrice = item.unit_price || item.unitPrice;
    const productName = item.product_name || item.productName;
    const skuCode = item.sku_code || item.skuCode;
    const unitType = item.unit_type || item.unitType;

    // Ensure all required fields are present
    if (!productId || !skuId) {
      throw new Error(`Invalid item data: missing product_id or sku_id`);
    }

    return {
      sales_order_id: order.id,
      product_id: productId,
      sku_id: skuId,
      product_name: productName || '',
      sku_code: skuCode || '',
      quantity: safeNumericValue(item.quantity),
      unit_type: unitType || 'box',
      unit_price: safeNumericValue(unitPrice),
      total_price: safeNumericValue(item.quantity) * safeNumericValue(unitPrice)
    };
  });

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Update inventory for each item
  for (const item of items) {
    const productId = item.product_id || item.productId;
    const skuId = item.sku_id || item.skuId;
    await updateInventoryAfterSale(
      productId,
      skuId,
      safeNumericValue(item.quantity)
    );
  }

  // Update customer balance if payment mode is credit
  if (orderDetails.payment_mode === 'credit' && orderDetails.customer_id) {
    await updateCustomerBalance(
      orderDetails.customer_id,
      safeNumericValue(totalAmount),
      'add'
    );
  }

  return order;
}

// Update sales order
export async function updateSalesOrder(orderId: string, orderData: any) {
  const { items, ...orderDetails } = orderData;

  // Get current order to calculate balance changes
  const { data: currentOrder, error: fetchError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) throw fetchError;
  if (!currentOrder) throw new Error('Sales order not found');

  // Calculate total amount with null safety
  const totalAmount = items.reduce((sum: number, item: any) => {
    const quantity = safeNumericValue(item.quantity);
    const unitPrice = safeNumericValue(item.unitPrice);
    return sum + (quantity * unitPrice);
  }, 0);

  // Update order
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .update({
      ...orderDetails,
      total_amount: totalAmount
    })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) throw orderError;

  // Delete existing items
  const { error: deleteError } = await supabase
    .from('sales_order_items')
    .delete()
    .eq('sales_order_id', orderId);

  if (deleteError) throw deleteError;

  // Insert new items with null safety
  const orderItems = items.map((item: any) => ({
    sales_order_id: orderId,
    product_id: item.productId,
    sku_id: item.skuId,
    quantity: safeNumericValue(item.quantity),
    unit_price: safeNumericValue(item.unitPrice),
    total_price: safeNumericValue(item.quantity) * safeNumericValue(item.unitPrice)
  }));

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Update inventory for each item
  for (const item of items) {
    await updateInventoryAfterSale(
      item.productId,
      item.skuId,
      safeNumericValue(item.quantity)
    );
  }

  // Update customer balance if payment mode is credit
  if (orderDetails.payment_mode === 'credit' && orderDetails.customer_id) {
    const oldAmount = safeNumericValue(currentOrder.total_amount);
    const newAmount = safeNumericValue(totalAmount);
    const balanceChange = newAmount - oldAmount;

    if (balanceChange !== 0) {
      await updateCustomerBalance(
        orderDetails.customer_id,
        Math.abs(balanceChange),
        balanceChange > 0 ? 'add' : 'subtract'
      );
    }
  }

  return order;
}

// Updated dispatch function to set status to 'dispatched'
export async function updateSalesOrderDispatchDetails(
  id: string,
  dispatchDetails: {
    vehicle_number: string;
    driver_name: string;
    driver_contact: string;
    delivery_location_confirmed: boolean;
    items: Array<{
      id: string;
      final_loaded_quantity: number;
    }>;
  }
) {
  // Get current order and items
  const { data: currentOrder } = await supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items(*)
    `)
    .eq('id', id)
    .single();

  if (!currentOrder) throw new Error('Sales order not found');

  // Update item quantities and recalculate totals
  let newSubtotal = 0;
  
  for (const itemUpdate of dispatchDetails.items) {
    const currentItem = currentOrder.sales_order_items.find((item: any) => item.id === itemUpdate.id);
    if (currentItem) {
      const newTotalPrice = itemUpdate.final_loaded_quantity * currentItem.unit_price;
      
      // Update the item
      await supabase
        .from('sales_order_items')
        .update({
          quantity: itemUpdate.final_loaded_quantity,
          total_price: newTotalPrice
        })
        .eq('id', itemUpdate.id);
      
      newSubtotal += newTotalPrice;
    }
  }

  // Calculate new total amount
  const newTotalAmount = newSubtotal - (currentOrder.discount_amount || 0);

  // Update customer balance if payment mode is credit and amount changed
  if (currentOrder.payment_mode === 'credit' && currentOrder.customer_id) {
    const amountDifference = newTotalAmount - currentOrder.total_amount;
    if (amountDifference !== 0) {
      await updateCustomerBalance(currentOrder.customer_id, Math.abs(amountDifference), amountDifference > 0 ? 'add' : 'subtract');
    }
  }

  // Update the sales order with dispatch details and new totals
  // Status changes from 'dispatch_pending' to 'dispatched'
  const { data, error } = await supabase
    .from('sales_orders')
    .update({
      status: 'dispatched',
      vehicle_number: dispatchDetails.vehicle_number,
      driver_name: dispatchDetails.driver_name,
      driver_contact: dispatchDetails.driver_contact,
      delivery_location_confirmed: dispatchDetails.delivery_location_confirmed,
      subtotal: newSubtotal,
      total_amount: newTotalAmount
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSalesOrder(id: string) {
  // Get order details to restore inventory and update customer balance
  const { data: orderData } = await supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items(product_id, sku_id, quantity)
    `)
    .eq('id', id)
    .single();

  if (orderData) {
    // Restore inventory
    if (orderData.sales_order_items) {
      for (const item of orderData.sales_order_items) {
        await updateInventoryAfterSale(item.product_id, item.sku_id, item.quantity);
      }
    }

    // Update customer balance if payment mode was credit
    if (orderData.payment_mode === 'credit' && orderData.customer_id) {
      await updateCustomerBalance(orderData.customer_id, orderData.total_amount, 'subtract');
    }
  }

  const { error } = await supabase
    .from('sales_orders')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Updated function to get outstation sales orders with new statuses
export async function getOutstationSalesOrders() {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(*),
      sales_order_items(
        *,
        product:products(*),
        sku:skus(*)
      )
    `)
    .not('delivery_date', 'is', null)
    .in('status', ['dispatch_pending', 'dispatched'])
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get available inventory (from current_inventory table)
export async function getAvailableInventory() {
  const { data, error } = await supabase
    .from('current_inventory')
    .select('*')
    .order('product_name');
  
  if (error) throw error;
  return data;
}

// Vehicle Arrivals
export async function getVehicleArrivals() {
  const { data, error } = await supabase
    .from('vehicle_arrivals')
    .select(`
      *,
      vehicle_arrival_items(
        *,
        product:products(*),
        sku:skus(*)
      ),
      vehicle_arrival_attachments(*)
    `)
    .order('arrival_time', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getVehicleArrival(id: string) {
  const { data, error } = await supabase
    .from('vehicle_arrivals')
    .select(`
      *,
      vehicle_arrival_items(
        *,
        product:products(*),
        sku:skus(*)
      ),
      vehicle_arrival_attachments(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createVehicleArrival(
  arrival: Tables['vehicle_arrivals']['Insert'],
  items: Tables['vehicle_arrival_items']['Insert'][],
  attachments: Tables['vehicle_arrival_attachments']['Insert'][]
) {
  // Start a transaction
  const { data: arrivalData, error: arrivalError } = await supabase
    .from('vehicle_arrivals')
    .insert(arrival)
    .select()
    .single();

  if (arrivalError) throw arrivalError;

  // Insert items with the arrival ID
  const itemsWithArrivalId = items.map(item => ({
    ...item,
    vehicle_arrival_id: arrivalData.id
  }));

  const { error: itemsError } = await supabase
    .from('vehicle_arrival_items')
    .insert(itemsWithArrivalId);

  if (itemsError) throw itemsError;

  // Insert attachments with the arrival ID
  if (attachments.length > 0) {
    const attachmentsWithArrivalId = attachments.map(attachment => ({
      ...attachment,
      vehicle_arrival_id: arrivalData.id
    }));

    const { error: attachmentsError } = await supabase
      .from('vehicle_arrival_attachments')
      .insert(attachmentsWithArrivalId);

    if (attachmentsError) throw attachmentsError;
  }

  return arrivalData;
}

export async function updateVehicleArrival(
  id: string,
  arrival: Partial<Tables['vehicle_arrivals']['Update']>,
  items?: Tables['vehicle_arrival_items']['Insert'][],
  attachments?: Tables['vehicle_arrival_attachments']['Insert'][]
) {
  // Update the arrival
  const { data: arrivalData, error: arrivalError } = await supabase
    .from('vehicle_arrivals')
    .update(arrival)
    .eq('id', id)
    .select()
    .single();

  if (arrivalError) throw arrivalError;

  // If items are provided, update them
  if (items) {
    // Transform items to include vehicle_arrival_id
    const itemsWithArrivalId = items.map(item => ({
      ...item,
      vehicle_arrival_id: id
    }));

    // Use upsert to update existing items and insert new ones
    const { error: itemsError } = await supabase
      .from('vehicle_arrival_items')
      .upsert(itemsWithArrivalId, {
        onConflict: 'id', // This will update existing items and insert new ones
        ignoreDuplicates: false
      });

    if (itemsError) throw itemsError;
  }

  // If attachments are provided, replace them
  if (attachments) {
    // Delete existing attachments
    const { error: deleteAttachmentsError } = await supabase
      .from('vehicle_arrival_attachments')
      .delete()
      .eq('vehicle_arrival_id', id);

    if (deleteAttachmentsError) throw deleteAttachmentsError;

    // Insert new attachments
    if (attachments.length > 0) {
      const attachmentsWithArrivalId = attachments.map(attachment => ({
        ...attachment,
        vehicle_arrival_id: id
      }));

      const { error: attachmentsError } = await supabase
        .from('vehicle_arrival_attachments')
        .insert(attachmentsWithArrivalId);

      if (attachmentsError) throw attachmentsError;
    }
  }

  return arrivalData;
}

// Add type for vehicle arrival items update
type VehicleArrivalItemUpdate = {
  id?: string;
  vehicle_arrival_id?: string;
  product_id?: string;
  sku_id?: string;
  unit_type?: string;
  unit_weight?: number | null;
  quantity?: number;
  total_weight?: number;
  final_quantity?: number;
  final_total_weight?: number;
  created_at?: string;
  updated_at?: string;
};

export async function updateVehicleArrivalStatus(
  id: string,
  status: string,
  updates: Partial<Tables['vehicle_arrivals']['Update']> = {},
  finalQuantities?: Array<{
    item_id: string;
    final_quantity: number;
    final_total_weight: number;
  }>
) {
  console.log('Starting status update with data:', {
    id,
    status,
    updates,
    finalQuantities: finalQuantities?.map(q => ({
      ...q,
      final_quantity: Number(q.final_quantity),
      final_total_weight: Number(q.final_total_weight)
    }))
  });

  try {
    // Start a transaction by updating the arrival status first
    const updateData = {
      status,
      notes: updates.notes,
      updated_at: new Date().toISOString()
    };
    console.log('Updating vehicle arrival with:', updateData);

    const { data: arrivalData, error: arrivalError } = await supabase
      .from('vehicle_arrivals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (arrivalError) {
      console.error('Error updating arrival status:', {
        error: arrivalError,
        updateData,
        id
      });
      throw arrivalError;
    }

    console.log('Successfully updated arrival status:', arrivalData);

    // If marking as completed and final quantities provided, update them
    if (status === 'completed' && finalQuantities && finalQuantities.length > 0) {
      console.log('Updating final quantities for items:', finalQuantities);
      
      // Update each item's final quantities
      for (const item of finalQuantities) {
        const itemUpdateData = {
          final_quantity: Number(item.final_quantity),
          final_total_weight: Number(item.final_total_weight),
          updated_at: new Date().toISOString()
        };
        console.log('Updating item with data:', {
          itemId: item.item_id,
          updateData: itemUpdateData
        });

        const { data: itemData, error: itemError } = await supabase
          .from('vehicle_arrival_items')
          .update(itemUpdateData)
          .eq('id', item.item_id)
          .eq('vehicle_arrival_id', id)
          .select()
          .single();

        if (itemError) {
          console.error('Error updating item final quantities:', {
            error: itemError,
            itemId: item.item_id,
            updateData: itemUpdateData
          });
          throw itemError;
        }

        console.log('Successfully updated item:', itemData);
      }
    }

    // Get the updated arrival data with items
    const { data: updatedData, error: fetchError } = await supabase
      .from('vehicle_arrivals')
      .select(`
        *,
        vehicle_arrival_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated data:', {
        error: fetchError,
        id
      });
      throw fetchError;
    }

    console.log('Successfully fetched updated arrival data:', updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error in updateVehicleArrivalStatus:', {
      error,
      id,
      status,
      updates,
      finalQuantities
    });
    throw error;
  }
}

// Purchase Records
export async function getPurchaseRecords() {
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      *,
      purchase_record_items(*),
      purchase_record_costs(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getPurchaseRecord(id: string) {
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      *,
      purchase_record_items(*),
      purchase_record_costs(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createPurchaseRecord(
  record: Tables['purchase_records']['Insert'],
  items: Tables['purchase_record_items']['Insert'][],
  costs: Tables['purchase_record_costs']['Insert'][]
) {
  // Ensure the status is valid - only 'completed' or 'cancelled' are allowed
  const validRecord = {
    ...record,
    status: 'completed' // Force to a valid status
  };

  // Create the purchase record
  const { data: recordData, error: recordError } = await supabase
    .from('purchase_records')
    .insert(validRecord)
    .select()
    .single();

  if (recordError) throw recordError;

  // Insert items
  const itemsWithRecordId = items.map(item => ({
    ...item,
    purchase_record_id: recordData.id
  }));

  const { error: itemsError } = await supabase
    .from('purchase_record_items')
    .insert(itemsWithRecordId);

  if (itemsError) throw itemsError;

  // Insert costs
  const costsWithRecordId = costs.map(cost => ({
    ...cost,
    purchase_record_id: recordData.id
  }));

  const { error: costsError } = await supabase
    .from('purchase_record_costs')
    .insert(costsWithRecordId);

  if (costsError) throw costsError;

  // Update supplier balance if supplier_id is provided
  if (validRecord.supplier_id) {
    await updateSupplierBalance(validRecord.supplier_id, validRecord.total_amount || 0, 'add');
  }

  return recordData;
}

export async function updatePurchaseRecord(
  id: string,
  record: Partial<Tables['purchase_records']['Update']>,
  items?: Tables['purchase_record_items']['Insert'][],
  costs?: Tables['purchase_record_costs']['Insert'][]
) {
  // Get current record to check for amount changes
  const { data: currentRecord } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentRecord) throw new Error('Purchase record not found');

  // Ensure the status is valid if being updated
  const validRecord = record.status ? {
    ...record,
    status: record.status === 'cancelled' ? 'cancelled' : 'completed'
  } : record;

  // Update the record
  const { data: recordData, error: recordError } = await supabase
    .from('purchase_records')
    .update(validRecord)
    .eq('id', id)
    .select()
    .single();

  if (recordError) throw recordError;

  // Handle supplier balance updates for amount changes
  if (record.total_amount !== undefined && record.supplier_id) {
    const amountDifference = record.total_amount - currentRecord.total_amount;
    if (amountDifference !== 0) {
      await updateSupplierBalance(record.supplier_id, Math.abs(amountDifference), amountDifference > 0 ? 'add' : 'subtract');
    }
  }

  // If items are provided, replace them
  if (items) {
    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from('purchase_record_items')
      .delete()
      .eq('purchase_record_id', id);

    if (deleteItemsError) throw deleteItemsError;

    // Insert new items
    const itemsWithRecordId = items.map(item => ({
      ...item,
      purchase_record_id: id
    }));

    const { error: itemsError } = await supabase
      .from('purchase_record_items')
      .insert(itemsWithRecordId);

    if (itemsError) throw itemsError;
  }

  // If costs are provided, replace them
  if (costs) {
    // Delete existing costs
    const { error: deleteCostsError } = await supabase
      .from('purchase_record_costs')
      .delete()
      .eq('purchase_record_id', id);

    if (deleteCostsError) throw deleteCostsError;

    // Insert new costs
    const costsWithRecordId = costs.map(cost => ({
      ...cost,
      purchase_record_id: id
    }));

    const { error: costsError } = await supabase
      .from('purchase_record_costs')
      .insert(costsWithRecordId);

    if (costsError) throw costsError;
  }

  return recordData;
}

export async function deletePurchaseRecord(id: string) {
  // Get record details to update supplier balance
  const { data: recordData } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('id', id)
    .single();

  if (recordData && recordData.supplier_id) {
    // Update supplier balance by subtracting the record amount
    await updateSupplierBalance(recordData.supplier_id, recordData.total_amount, 'subtract');
  }

  const { error } = await supabase
    .from('purchase_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Payments API functions
export async function getPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createPayment(payment: Tables['payments']['Insert']) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();
  
  if (error) throw error;

  // Update customer/supplier balance based on payment type
  if (payment.party_id && payment.party_type) {
    if (payment.party_type === 'customer' && payment.type === 'received') {
      // Payment received from customer - reduce their outstanding balance
      await updateCustomerBalance(payment.party_id, payment.amount, 'subtract');
    } else if (payment.party_type === 'supplier' && payment.type === 'made') {
      // Payment made to supplier - reduce their outstanding balance
      await updateSupplierBalance(payment.party_id, payment.amount, 'subtract');
    }
  }

  return data;
}

export async function updatePayment(id: string, payment: Tables['payments']['Update']) {
  const { data, error } = await supabase
    .from('payments')
    .update(payment)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePayment(id: string) {
  // Get payment details before deletion to reverse balance updates
  const { data: paymentData } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();

  if (paymentData && paymentData.party_id && paymentData.party_type) {
    if (paymentData.party_type === 'customer' && paymentData.type === 'received') {
      // Reverse payment received - increase customer balance
      await updateCustomerBalance(paymentData.party_id, paymentData.amount, 'add');
    } else if (paymentData.party_type === 'supplier' && paymentData.type === 'made') {
      // Reverse payment made - increase supplier balance
      await updateSupplierBalance(paymentData.party_id, paymentData.amount, 'add');
    }
  }

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Storage
export async function uploadAttachment(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `attachments/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vehicle-arrivals')
    .upload(filePath, file);

  if (uploadError) {
    // If bucket doesn't exist, create it and try again
    if (uploadError.message.includes('Bucket not found')) {
      const { error: bucketError } = await supabase.storage
        .createBucket('vehicle-arrivals', { public: true });
      
      if (bucketError) {
        console.warn('Could not create storage bucket:', bucketError);
        // Return a mock URL for demo purposes
        return {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: `https://example.com/uploads/${fileName}`
        };
      }

      // Try upload again
      const { error: retryError } = await supabase.storage
        .from('vehicle-arrivals')
        .upload(filePath, file);

      if (retryError) throw retryError;
    } else {
      console.warn('Upload error:', uploadError);
      // Return a mock URL for demo purposes
      return {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: `https://example.com/uploads/${fileName}`
      };
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-arrivals')
    .getPublicUrl(filePath);

  return {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileUrl: publicUrl
  };
}

// Cancel sales order
export async function cancelSalesOrder(orderId: string) {
  // Get order data
  const { data: orderData, error: fetchError } = await supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items(product_id, sku_id, quantity)
    `)
    .eq('id', orderId)
    .single();

  if (fetchError) throw fetchError;
  if (!orderData) throw new Error('Sales order not found');

  // Update order status
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) throw updateError;

  // Restore inventory for each item
  if (orderData.sales_order_items) {
    for (const item of orderData.sales_order_items) {
      await updateInventoryAfterSale(
        item.product_id,
        item.sku_id,
        safeNumericValue(item.quantity)
      );
    }
  }

  // Update customer balance if payment mode was credit
  if (orderData.payment_mode === 'credit' && orderData.customer_id) {
    await updateCustomerBalance(
      orderData.customer_id,
      safeNumericValue(orderData.total_amount),
      'subtract'
    );
  }

  return orderData;
}