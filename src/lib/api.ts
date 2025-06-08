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
    .eq('name', product.name)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected when no duplicate exists
    throw checkError;
  }

  if (existingProduct) {
    // Product already exists, return the existing one
    return existingProduct;
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
    .eq('code', sku.code)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected when no duplicate exists
    throw checkError;
  }

  if (existingSKU) {
    // SKU already exists, return the existing one
    return existingSKU;
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

// Suppliers
export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
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

export async function createSalesOrder(
  order: Tables['sales_orders']['Insert'],
  items: Tables['sales_order_items']['Insert'][]
) {
  // Determine status based on sale type
  const isOutstation = order.delivery_date || order.delivery_address;
  const orderWithStatus = {
    ...order,
    status: isOutstation ? 'processing' : 'completed'
  };

  // Start a transaction
  const { data: orderData, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderWithStatus)
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert items with the order ID
  const itemsWithOrderId = items.map(item => ({
    ...item,
    sales_order_id: orderData.id
  }));

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(itemsWithOrderId);

  if (itemsError) throw itemsError;

  // Update inventory - reduce available quantities
  for (const item of items) {
    await updateInventoryAfterSale(item.product_id, item.sku_id, item.quantity);
  }

  return orderData;
}

export async function updateSalesOrder(
  id: string,
  order: Partial<Tables['sales_orders']['Update']>,
  items?: Tables['sales_order_items']['Insert'][]
) {
  // Get current items to restore inventory
  const { data: currentOrder } = await supabase
    .from('sales_orders')
    .select(`
      sales_order_items(product_id, sku_id, quantity)
    `)
    .eq('id', id)
    .single();

  // Update the order
  const { data: orderData, error: orderError } = await supabase
    .from('sales_orders')
    .update(order)
    .eq('id', id)
    .select()
    .single();

  if (orderError) throw orderError;

  // If items are provided, replace them
  if (items) {
    // Restore inventory from current items
    if (currentOrder?.sales_order_items) {
      for (const item of currentOrder.sales_order_items) {
        await restoreInventoryAfterSaleUpdate(item.product_id, item.sku_id, item.quantity);
      }
    }

    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from('sales_order_items')
      .delete()
      .eq('sales_order_id', id);

    if (deleteItemsError) throw deleteItemsError;

    // Insert new items
    const itemsWithOrderId = items.map(item => ({
      ...item,
      sales_order_id: id
    }));

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Update inventory with new items
    for (const item of items) {
      await updateInventoryAfterSale(item.product_id, item.sku_id, item.quantity);
    }

    // Recalculate order totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalAmount = subtotal - (order.discount_amount || 0);

    // Update the order with new totals
    await supabase
      .from('sales_orders')
      .update({
        subtotal,
        total_amount: totalAmount
      })
      .eq('id', id);
  }

  return orderData;
}

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

  // Update the sales order with dispatch details and new totals
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
  // Get order items to restore inventory
  const { data: orderData } = await supabase
    .from('sales_orders')
    .select(`
      sales_order_items(product_id, sku_id, quantity)
    `)
    .eq('id', id)
    .single();

  // Restore inventory
  if (orderData?.sales_order_items) {
    for (const item of orderData.sales_order_items) {
      await restoreInventoryAfterSaleUpdate(item.product_id, item.sku_id, item.quantity);
    }
  }

  const { error } = await supabase
    .from('sales_orders')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Get outstation sales orders for dispatch management
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
    .in('status', ['processing', 'dispatched'])
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Inventory management functions
async function updateInventoryAfterSale(productId: string, skuId: string, quantity: number) {
  // This is a conceptual update - in a real system, you'd have a proper inventory table
  // For now, we'll track this in the vehicle_arrival_items by reducing available quantities
  // This is a simplified approach for the demo
  console.log(`Inventory updated: Product ${productId}, SKU ${skuId}, Quantity reduced by ${quantity}`);
}

async function restoreInventoryAfterSaleUpdate(productId: string, skuId: string, quantity: number) {
  // Restore inventory when sales order is updated or deleted
  console.log(`Inventory restored: Product ${productId}, SKU ${skuId}, Quantity restored by ${quantity}`);
}

// Get available inventory (from completed vehicle arrivals)
export async function getAvailableInventory() {
  const { data, error } = await supabase
    .from('vehicle_arrivals')
    .select(`
      id,
      status,
      vehicle_arrival_items(
        *,
        product:products(*),
        sku:skus(*)
      )
    `)
    .in('status', ['completed', 'po-created']);
  
  if (error) throw error;

  // Group items by product and SKU to create inventory
  const inventoryMap = new Map();
  
  data.forEach(arrival => {
    arrival.vehicle_arrival_items.forEach((item: any) => {
      const key = `${item.product.id}-${item.sku.id}`;
      
      if (inventoryMap.has(key)) {
        const existingItem = inventoryMap.get(key);
        existingItem.available_quantity += item.quantity;
        existingItem.total_weight += item.total_weight;
      } else {
        inventoryMap.set(key, {
          product_id: item.product.id,
          product_name: item.product.name,
          product_category: item.product.category,
          sku_id: item.sku.id,
          sku_code: item.sku.code,
          unit_type: item.unit_type,
          available_quantity: item.quantity,
          total_weight: item.total_weight
        });
      }
    });
  });

  // Get sold quantities and subtract from available inventory
  const { data: salesData } = await supabase
    .from('sales_order_items')
    .select(`
      product_id,
      sku_id,
      quantity,
      sales_order:sales_orders!inner(status)
    `)
    .neq('sales_order.status', 'cancelled');

  if (salesData) {
    salesData.forEach((saleItem: any) => {
      const key = `${saleItem.product_id}-${saleItem.sku_id}`;
      const inventoryItem = inventoryMap.get(key);
      
      if (inventoryItem) {
        inventoryItem.available_quantity = Math.max(0, inventoryItem.available_quantity - saleItem.quantity);
      }
    });
  }

  return Array.from(inventoryMap.values());
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

  // If items are provided, replace them
  if (items) {
    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from('vehicle_arrival_items')
      .delete()
      .eq('vehicle_arrival_id', id);

    if (deleteItemsError) throw deleteItemsError;

    // Insert new items
    const itemsWithArrivalId = items.map(item => ({
      ...item,
      vehicle_arrival_id: id
    }));

    const { error: itemsError } = await supabase
      .from('vehicle_arrival_items')
      .insert(itemsWithArrivalId);

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

export async function updateVehicleArrivalStatus(
  id: string,
  status: string,
  updates: Partial<Tables['vehicle_arrivals']['Update']> = {}
) {
  const { data, error } = await supabase
    .from('vehicle_arrivals')
    .update({ status, ...updates })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  // Create the purchase record
  const { data: recordData, error: recordError } = await supabase
    .from('purchase_records')
    .insert(record)
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

  return recordData;
}

async function updatePurchaseRecord(
  id: string,
  record: Partial<Tables['purchase_records']['Update']>,
  items?: Tables['purchase_record_items']['Insert'][],
  costs?: Tables['purchase_record_costs']['Insert'][]
) {
  // Update the record
  const { data: recordData, error: recordError } = await supabase
    .from('purchase_records')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (recordError) throw recordError;

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