import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, skus(*)');
  
  if (error) throw error;
  return data;
}

export async function createProduct(product: Tables['products']['Insert']) {
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
  const { data, error } = await supabase
    .from('skus')
    .insert(sku)
    .select()
    .single();
  
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

// Storage
export async function uploadAttachment(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `attachments/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vehicle-arrivals')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

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