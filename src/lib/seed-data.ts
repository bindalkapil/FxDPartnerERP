import { supabase } from './supabase';

const products = [
  { name: 'POMO MH', category: 'Pomegranate', description: 'Maharashtra Pomegranate' },
  { name: 'POMO GJ', category: 'Pomegranate', description: 'Gujarat Pomegranate' },
  { name: 'Sindura', category: 'Mango', description: 'Sindura Mango Variety' },
  { name: 'Alphonso', category: 'Mango', description: 'Premium Alphonso Mango' },
  { name: 'Washington Apple', category: 'Imported', description: 'Imported Washington Apples' }
];

const skus = [
  { 
    product_name: 'POMO MH', 
    code: 'POMO-MH-001',
    unit_type: 'box',
    unit_weight: 10
  },
  { 
    product_name: 'POMO GJ', 
    code: 'POMO-GJ-001',
    unit_type: 'box',
    unit_weight: 10
  },
  { 
    product_name: 'Sindura', 
    code: 'MNG-SIN-001',
    unit_type: 'box',
    unit_weight: 20
  },
  { 
    product_name: 'Alphonso', 
    code: 'MNG-ALP-001',
    unit_type: 'box',
    unit_weight: 5
  },
  { 
    product_name: 'Washington Apple', 
    code: 'IMP-APP-001',
    unit_type: 'box',
    unit_weight: 18
  }
];

export async function seedData() {
  // Insert products
  for (const product of products) {
    const { data: existingProduct } = await supabase
      .from('products')
      .select()
      .eq('name', product.name)
      .single();

    if (!existingProduct) {
      const { error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error && error.code !== '23505') {
        console.error('Error inserting product:', error);
      }
    }
  }

  // Get all products to map names to IDs
  const { data: productData } = await supabase
    .from('products')
    .select('id, name');

  if (!productData) return;

  const productMap = new Map(productData.map(p => [p.name, p.id]));

  // Insert SKUs
  for (const sku of skus) {
    const productId = productMap.get(sku.product_name);
    if (!productId) continue;

    // Check if SKU already exists
    const { data: existingSku } = await supabase
      .from('skus')
      .select()
      .eq('code', sku.code)
      .single();

    if (!existingSku) {
      const { error } = await supabase
        .from('skus')
        .insert({
          product_id: productId,
          code: sku.code,
          unit_type: sku.unit_type,
          unit_weight: sku.unit_weight
        })
        .select()
        .single();
      
      if (error && error.code !== '23505') {
        console.error('Error inserting SKU:', error);
      }
    }
  }
}