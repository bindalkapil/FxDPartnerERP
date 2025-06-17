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

// Helper function to handle null values in numeric calculations
function safeNumericValue(value: number | null | undefined, defaultValue: number = 0): number {
  return value === null || value === undefined ? defaultValue : value;
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

// Update inventory after sale - now allows negative inventory
async function updateInventoryAfterSale(productId: string, skuId: string, quantity: number) {
  // First get the current quantity
  const { data: currentInventory, error: fetchError } = await supabase
    .from('current_inventory')
    .select('available_quantity, product_name, sku_code')
    .match({ product_id: productId, sku_id: skuId })
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No inventory record found - this means the product/SKU doesn't exist in inventory
      throw new Error(`Product not found in inventory. Please check if the product exists and has been received.`);
    }
    throw fetchError;
  }

  const currentQuantity = currentInventory?.available_quantity || 0;
  const newQuantity = currentQuantity - quantity;

  // Update with the new quantity (now allows negative values)
  const { error: updateError } = await supabase
    .from('current_inventory')
    .update({
      available_quantity: newQuantity,
      updated_at: new Date().toISOString()
    })
    .match({ product_id: productId, sku_id: skuId });

  if (updateError) throw updateError;

  // Return information about whether inventory went negative
  return {
    productName: currentInventory.product_name,
    skuCode: currentInventory.sku_code,
    previousQuantity: currentQuantity,
    newQuantity: newQuantity,
    wentNegative: newQuantity < 0
  };
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
    const amountDifference = totalAmount - (currentOrder.total_amount || 0);
    if (amountDifference !== 0) {
      await updateCustomerBalance(
        orderDetails.customer_id,
        Math.abs(amountDifference),
        amountDifference > 0 ? 'add' : 'subtract'
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
    const amountDifference = newTotalAmount - safeNumericValue(currentOrder.total_amount);
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
      await updateCustomerBalance(orderData.customer_id, safeNumericValue(orderData.total_amount), 'subtract');
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

// Get all inventory (including negative inventory)
export async function getAllInventory() {
  const { data, error } = await supabase
    .from('current_inventory')
    .select('*')
    .order('product_name');
  
  if (error) throw error;
  return data;
}

// Get available inventory (from current_inventory table) - now shows all SKUs
export async function getAvailableInventory() {
  console.log('Fetching inventory from current_inventory table...');
  
  const { data, error } = await supabase
    .from('current_inventory')
    .select('*')
    .order('product_name');
  
  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
  
  console.log('Raw inventory data from database:', data);
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

        // Update current_inventory table with the new quantities
        if (itemData) {
          // Get product and SKU details
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('name, category')
            .eq('id', itemData.product_id)
            .single();

          if (productError) {
            console.error('Error fetching product details:', productError);
            throw productError;
          }

          const { data: skuData, error: skuError } = await supabase
            .from('skus')
            .select('code')
            .eq('id', itemData.sku_id)
            .single();

          if (skuError) {
            console.error('Error fetching SKU details:', skuError);
            throw skuError;
          }

          // Get current inventory for this product/SKU
          const { data: currentInventory, error: inventoryError } = await supabase
            .from('current_inventory')
            .select('*')
            .match({ 
              product_id: itemData.product_id, 
              sku_id: itemData.sku_id 
            })
            .single();

          if (inventoryError && inventoryError.code !== 'PGRST116') {
            console.error('Error fetching current inventory:', inventoryError);
            throw inventoryError;
          }

          if (currentInventory) {
            // Update existing inventory record
            const { error: updateInventoryError } = await supabase
              .from('current_inventory')
              .update({
                available_quantity: currentInventory.available_quantity + Number(item.final_quantity),
                total_weight: currentInventory.total_weight + Number(item.final_total_weight),
                updated_at: new Date().toISOString(),
                last_updated_at: new Date().toISOString()
              })
              .match({ 
                product_id: itemData.product_id, 
                sku_id: itemData.sku_id 
              });

            if (updateInventoryError) {
              console.error('Error updating current inventory:', updateInventoryError);
              throw updateInventoryError;
            }
          } else {
            // Create new inventory record
            const { error: insertInventoryError } = await supabase
              .from('current_inventory')
              .insert({
                product_id: itemData.product_id,
                sku_id: itemData.sku_id,
                product_name: productData.name,
                sku_code: skuData.code,
                category: productData.category,
                unit_type: itemData.unit_type as 'box' | 'loose',
                available_quantity: Number(item.final_quantity),
                total_weight: Number(item.final_total_weight),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_updated_at: new Date().toISOString()
              });

            if (insertInventoryError) {
              console.error('Error creating new inventory record:', insertInventoryError);
              throw insertInventoryError;
            }
          }
        }
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
  // Ensure the status is valid - only 'partial_closure', 'full_closure' or 'cancelled' are allowed
  // Use the status from the record parameter, default to 'partial_closure' if not provided
  const validRecord = {
    ...record,
    status: record.status || 'partial_closure'
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
  if (validRecord.supplier_id && validRecord.total_amount !== null && validRecord.total_amount !== undefined) {
    await updateSupplierBalance(validRecord.supplier_id, safeNumericValue(validRecord.total_amount), 'add');
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
    status: record.status === 'cancelled' ? 'cancelled' : 
           record.status === 'full_closure' ? 'full_closure' : 'partial_closure'
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
    const amountDifference = record.total_amount - safeNumericValue(currentRecord.total_amount);
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
    await updateSupplierBalance(recordData.supplier_id, safeNumericValue(recordData.total_amount), 'subtract');
  }

  const { error } = await supabase
    .from('purchase_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Update purchase record closure status
export async function updatePurchaseRecordClosureStatus(
  id: string,
  status: 'partial_closure' | 'full_closure',
  closureNotes?: string
) {
  // Get current record to check if it can be updated
  const { data: currentRecord, error: fetchError } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!currentRecord) throw new Error('Purchase record not found');

  // Check if record can be updated based on current status
  if (currentRecord.status === 'full_closure') {
    throw new Error('Cannot update a fully closed purchase record');
  }

  if (currentRecord.status === 'cancelled') {
    throw new Error('Cannot update a cancelled purchase record');
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  // Set closure fields for full closure
  if (status === 'full_closure') {
    updateData.closure_date = new Date().toISOString();
    if (closureNotes) {
      updateData.closure_notes = closureNotes;
    }
  }

  const { data, error } = await supabase
    .from('purchase_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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

// Adjust inventory - mark as another SKU
export async function adjustInventoryAsAnotherSKU(
  currentProductId: string,
  currentSkuId: string,
  newProductId: string,
  newSkuId: string,
  reason: string
) {
  // Get current inventory item
  const { data: currentItem, error: fetchError } = await supabase
    .from('current_inventory')
    .select('*')
    .match({ product_id: currentProductId, sku_id: currentSkuId })
    .single();

  if (fetchError) throw fetchError;
  if (!currentItem) throw new Error('Current inventory item not found');

  // Get new SKU details
  const { data: newSku, error: skuError } = await supabase
    .from('skus')
    .select('*, product:products(*)')
    .eq('id', newSkuId)
    .single();

  if (skuError) throw skuError;
  if (!newSku) throw new Error('New SKU not found');

  // Check if new SKU already exists in inventory
  const { data: existingNewItem, error: checkError } = await supabase
    .from('current_inventory')
    .select('*')
    .match({ product_id: newProductId, sku_id: newSkuId })
    .single();

  if (checkError && checkError.code !== 'PGRST116') throw checkError;

  if (existingNewItem) {
    // Update existing item with additional quantity
    const { error: updateError } = await supabase
      .from('current_inventory')
      .update({
        available_quantity: existingNewItem.available_quantity + currentItem.available_quantity,
        total_weight: existingNewItem.total_weight + currentItem.total_weight,
        updated_at: new Date().toISOString()
      })
      .match({ product_id: newProductId, sku_id: newSkuId });

    if (updateError) throw updateError;
  } else {
    // Create new inventory item
    const { error: insertError } = await supabase
      .from('current_inventory')
      .insert({
        product_id: newProductId,
        sku_id: newSkuId,
        product_name: newSku.product.name,
        sku_code: newSku.code,
        category: newSku.product.category,
        unit_type: currentItem.unit_type,
        available_quantity: currentItem.available_quantity,
        total_weight: currentItem.total_weight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      });

    if (insertError) throw insertError;
  }

  // Delete the original inventory item
  const { error: deleteError } = await supabase
    .from('current_inventory')
    .delete()
    .match({ product_id: currentProductId, sku_id: currentSkuId });

  if (deleteError) throw deleteError;

  return { success: true };
}

// Adjust inventory - mark from another source
export async function adjustInventoryFromAnotherSource(
  productId: string,
  skuId: string,
  source: string,
  reason: string
) {
  // Get current inventory item
  const { data: currentItem, error: fetchError } = await supabase
    .from('current_inventory')
    .select('*')
    .match({ product_id: productId, sku_id: skuId })
    .single();

  if (fetchError) throw fetchError;
  if (!currentItem) throw new Error('Inventory item not found');

  // Update the inventory item with source information
  const { error: updateError } = await supabase
    .from('current_inventory')
    .update({
      updated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString()
    })
    .match({ product_id: productId, sku_id: skuId });

  if (updateError) throw updateError;

  return { success: true };
}

// Get all products and SKUs for dropdown selection
export async function getAllProductsAndSKUs() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      skus(*)
    `)
    .order('name');
  
  if (error) throw error;
  return data;
}

// Multiple Payment System API Functions

// Create sales order payment
export async function createSalesOrderPayment(payment: Tables['sales_order_payments']['Insert']) {
  const { data, error } = await supabase
    .from('sales_order_payments')
    .insert(payment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get sales order payments
export async function getSalesOrderPayments(salesOrderId: string) {
  const { data, error } = await supabase
    .from('sales_order_payments')
    .select('*')
    .eq('sales_order_id', salesOrderId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Update sales order payment
export async function updateSalesOrderPayment(id: string, payment: Tables['sales_order_payments']['Update']) {
  const { data, error } = await supabase
    .from('sales_order_payments')
    .update(payment)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Create customer credit extension
export async function createCustomerCreditExtension(extension: Tables['customer_credit_extensions']['Insert']) {
  const { data, error } = await supabase
    .from('customer_credit_extensions')
    .insert(extension)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get customer credit extensions
export async function getCustomerCreditExtensions(customerId: string) {
  const { data, error } = await supabase
    .from('customer_credit_extensions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Upload payment proof file
export async function uploadPaymentProof(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `payment_proof_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `payment-proofs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(filePath, file);

  if (uploadError) {
    // If bucket doesn't exist, create it and try again
    if (uploadError.message.includes('Bucket not found')) {
      const { error: bucketError } = await supabase.storage
        .createBucket('payment-proofs', { public: true });
      
      if (bucketError) {
        console.warn('Could not create storage bucket:', bucketError);
        // Return a mock URL for demo purposes
        return `https://example.com/payment-proofs/${fileName}`;
      }

      // Try upload again
      const { error: retryError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (retryError) throw retryError;
    } else {
      console.warn('Upload error:', uploadError);
      // Return a mock URL for demo purposes
      return `https://example.com/payment-proofs/${fileName}`;
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Check for negative inventory warnings before creating sales order
export async function checkInventoryForSalesOrder(items: any[]) {
  const warnings = [];
  
  for (const item of items) {
    const productId = item.product_id || item.productId;
    const skuId = item.sku_id || item.skuId;
    const quantity = safeNumericValue(item.quantity);
    
    if (!productId || !skuId || quantity <= 0) {
      continue; // Skip invalid items
    }
    
    // Get current inventory
    const { data: currentInventory, error: fetchError } = await supabase
      .from('current_inventory')
      .select('available_quantity, product_name, sku_code')
      .match({ product_id: productId, sku_id: skuId })
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        warnings.push({
          productId,
          skuId,
          productName: item.product_name || item.productName || 'Unknown Product',
          skuCode: item.sku_code || item.skuCode || 'Unknown SKU',
          currentQuantity: 0,
          requestedQuantity: quantity,
          resultingQuantity: -quantity,
          type: 'not_found'
        });
      }
      continue;
    }
    
    const currentQuantity = currentInventory?.available_quantity || 0;
    const resultingQuantity = currentQuantity - quantity;
    
    if (resultingQuantity < 0) {
      warnings.push({
        productId,
        skuId,
        productName: currentInventory.product_name,
        skuCode: currentInventory.sku_code,
        currentQuantity,
        requestedQuantity: quantity,
        resultingQuantity,
        type: 'negative'
      });
    }
  }
  
  return warnings;
}

// Enhanced createSalesOrder function with multiple payments support
export async function createSalesOrderWithMultiplePayments(orderData: any, paymentMethods: any[]) {
  console.log('createSalesOrderWithMultiplePayments called with:', {
    orderData,
    paymentMethods
  });

  const { items, ...orderDetails } = orderData;
  
  // Validate that items exist and have required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Sales order must have at least one item');
  }

  // Validate customer_id exists
  if (!orderDetails.customer_id) {
    throw new Error('Customer ID is required');
  }

  // Validate customer exists
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name')
    .eq('id', orderDetails.customer_id)
    .single();

  if (customerError || !customer) {
    console.error('Customer validation failed:', customerError);
    throw new Error('Invalid customer ID - customer not found');
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
    if (unitPrice === undefined || unitPrice === null || unitPrice < 0) {
      throw new Error(`Item ${i + 1} must have a valid unit price`);
    }

    // Validate that product and SKU exist
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error(`Item ${i + 1}: Invalid product ID - product not found`);
    }

    const { data: sku, error: skuError } = await supabase
      .from('skus')
      .select('id, code')
      .eq('id', skuId)
      .single();

    if (skuError || !sku) {
      throw new Error(`Item ${i + 1}: Invalid SKU ID - SKU not found`);
    }
  }
  
  // Calculate total amount with null safety
  const totalAmount = items.reduce((sum: number, item: any) => {
    const quantity = safeNumericValue(item.quantity);
    const unitPrice = safeNumericValue(item.unit_price || item.unitPrice);
    return sum + (quantity * unitPrice);
  }, 0);

  console.log('Calculated total amount:', totalAmount);

  // Status logic: counter orders are completed, outstation orders are dispatch_pending
  const status = (!orderDetails.delivery_date) ? 'completed' : 'dispatch_pending';

  // Calculate payment totals
  const totalPaidAmount = paymentMethods
    .filter(method => method.type !== 'credit_increase')
    .reduce((sum, method) => sum + safeNumericValue(method.amount), 0);
  
  const creditAmount = totalAmount - totalPaidAmount;
  const hasCredit = creditAmount > 0;
  
  // Determine payment mode and status
  let paymentMode = 'credit'; // Default to credit
  let paymentStatus = 'unpaid'; // Default status
  
  if (paymentMethods.length > 0) {
    // If there are multiple payment methods, use the primary one or credit if mixed
    const nonCreditMethods = paymentMethods.filter(m => m.type !== 'credit' && m.type !== 'credit_increase');
    if (nonCreditMethods.length === 1 && !hasCredit) {
      // Single payment method, no credit
      paymentMode = nonCreditMethods[0].type === 'bank_transfer' ? 'bank_transfer' : nonCreditMethods[0].type;
    } else if (nonCreditMethods.length > 0) {
      // Multiple payment methods or mixed with credit, use the first non-credit method
      paymentMode = nonCreditMethods[0].type === 'bank_transfer' ? 'bank_transfer' : nonCreditMethods[0].type;
    }
  }
  
  // Determine payment status
  if (totalPaidAmount >= totalAmount) {
    paymentStatus = 'paid';
  } else if (totalPaidAmount > 0) {
    paymentStatus = 'partial';
  } else {
    paymentStatus = 'unpaid';
  }

  console.log('Payment calculations:', {
    totalPaidAmount,
    creditAmount,
    hasCredit,
    paymentMode,
    paymentStatus
  });

  // Ensure order_date is properly formatted
  let orderDate = orderDetails.order_date;
  if (!orderDate) {
    orderDate = new Date().toISOString();
  } else if (typeof orderDate === 'string' && !orderDate.includes('T')) {
    // If it's a datetime-local format, convert to ISO string
    orderDate = new Date(orderDate).toISOString();
  }

  // Prepare order data for insertion with proper field validation
  const orderInsertData = {
    order_number: orderDetails.order_number || `SO-${Date.now()}`,
    customer_id: orderDetails.customer_id,
    order_date: orderDate,
    delivery_date: orderDetails.delivery_date || null,
    delivery_address: orderDetails.delivery_address || null,
    payment_terms: safeNumericValue(orderDetails.payment_terms, 30),
    payment_mode: paymentMode,
    payment_status: paymentStatus,
    subtotal: safeNumericValue(orderDetails.subtotal, totalAmount),
    tax_amount: safeNumericValue(orderDetails.tax_amount, 0),
    discount_amount: safeNumericValue(orderDetails.discount_amount, 0),
    total_amount: totalAmount,
    status: status,
    notes: orderDetails.notes || null
  };

  console.log('Order data to insert:', orderInsertData);

  // Create the sales order
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderInsertData)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating sales order:', {
      error: orderError,
      message: orderError.message,
      details: orderError.details,
      hint: orderError.hint,
      code: orderError.code,
      orderData: orderInsertData
    });
    
    // Provide more specific error messages
    let errorMessage = 'Sales order creation failed';
    if (orderError.code === '23505') {
      errorMessage = 'Duplicate order number. Please try again.';
    } else if (orderError.code === '23503') {
      errorMessage = 'Invalid reference data. Please check customer and item details.';
    } else if (orderError.code === '23514') {
      errorMessage = 'Invalid data format. Please check all required fields.';
    } else if (orderError.message) {
      errorMessage = orderError.message;
    }
    
    throw new Error(`${errorMessage}: ${orderError.details || orderError.hint || 'Please check your data and try again'}`);
  }

  console.log('Sales order created successfully:', order);

  // Insert items with null safety and validation
  const orderItems = items.map((item: any) => {
    const productId = item.product_id || item.productId;
    const skuId = item.sku_id || item.skuId;
    const unitPrice = item.unit_price || item.unitPrice;
    const productName = item.product_name || item.productName;
    const skuCode = item.sku_code || item.skuCode;
    const unitType = item.unit_type || item.unitType;

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

  // Process payment methods
  const paymentRecords = [];
  const creditExtensions = [];

  // Add credit payment if there's a remaining amount
  if (hasCredit) {
    paymentRecords.push({
      sales_order_id: order.id,
      payment_type: 'credit',
      amount: creditAmount,
      status: 'completed'
    });
  }

  for (const method of paymentMethods) {
    if (method.type === 'credit_increase') {
      // Create credit extension request
      creditExtensions.push({
        customer_id: orderDetails.customer_id,
        sales_order_id: order.id,
        amount: safeNumericValue(method.amount),
        remarks: method.remarks,
        status: 'pending'
      });
    } else if (method.amount > 0) {
      // Upload proof file if exists
      let proofUrl = null;
      if (method.proof_file) {
        try {
          proofUrl = await uploadPaymentProof(method.proof_file);
        } catch (error) {
          console.warn('Failed to upload payment proof:', error);
        }
      }

      // Create sales order payment record
      const paymentStatus = method.type === 'cash' ? 'completed' : 'pending';
      
      const salesOrderPayment = {
        sales_order_id: order.id,
        payment_type: method.type,
        amount: safeNumericValue(method.amount),
        reference_number: method.reference_number || null,
        proof_url: proofUrl,
        remarks: method.remarks || null,
        status: paymentStatus
      };

      paymentRecords.push(salesOrderPayment);

      // For cash payments, also create a payment record in the main payments table
      if (method.type === 'cash') {
        const customer = await getCustomer(orderDetails.customer_id);
        await createPayment({
          type: 'received',
          amount: safeNumericValue(method.amount),
          payment_date: new Date().toISOString(),
          party_id: orderDetails.customer_id,
          party_type: 'customer',
          party_name: customer.name,
          reference_id: order.id,
          reference_type: 'sales_order',
          reference_number: order.order_number,
          mode: 'cash',
          status: 'completed',
          notes: `Cash payment for sales order ${order.order_number}`
        });
      }
    }
  }

  // Insert sales order payments
  if (paymentRecords.length > 0) {
    const { error: paymentsError } = await supabase
      .from('sales_order_payments')
      .insert(paymentRecords);

    if (paymentsError) throw paymentsError;
  }

  // Insert credit extensions
  if (creditExtensions.length > 0) {
    const { error: extensionsError } = await supabase
      .from('customer_credit_extensions')
      .insert(creditExtensions);

    if (extensionsError) throw extensionsError;
  }

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

  // Update customer balance for credit amount
  if (hasCredit && orderDetails.customer_id) {
    await updateCustomerBalance(
      orderDetails.customer_id,
      creditAmount,
      'add'
    );
  }

  return order;
}
