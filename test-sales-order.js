// Simple test to reproduce the 400 error
import { createSalesOrderWithMultiplePayments } from './src/lib/api.js';

// Test data that mimics what the form would send
const testOrderData = {
  order_number: 'SO-TEST-' + Date.now(),
  customer_id: 'test-customer-id', // This will likely fail since it's not a real ID
  order_date: new Date().toISOString(),
  delivery_date: null,
  delivery_address: null,
  payment_terms: 30,
  payment_mode: 'credit',
  payment_status: 'unpaid',
  subtotal: 100,
  tax_amount: 0,
  discount_amount: 0,
  total_amount: 100,
  status: 'completed',
  notes: null,
  items: [
    {
      productId: 'test-product-id',
      skuId: 'test-sku-id',
      productName: 'Test Product',
      skuCode: 'TEST-001',
      quantity: 1,
      unitType: 'box',
      unitPrice: 100,
      totalPrice: 100
    }
  ]
};

const testPaymentMethods = [];

// Test the function
async function testSalesOrder() {
  try {
    console.log('Testing sales order creation...');
    const result = await createSalesOrderWithMultiplePayments(testOrderData, testPaymentMethods);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
}

testSalesOrder();
