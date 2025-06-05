import React from 'react';
import { useParams } from 'react-router-dom';
import NewPurchaseOrder from './NewPurchaseOrder';

const EditPurchaseOrder: React.FC = () => {
  const { id } = useParams();

  // Mock data - in a real app, this would be fetched from an API
  const orderData = {
    id: 'PO002',
    orderNumber: 'PO-2025-002',
    supplier: 'Fresh Harvests',
    orderDate: '2025-06-18T10:15',
    arrivalTimestamp: '2025-06-18T10:15',
    paymentTerms: 30,
    pricingModel: 'fixed' as const,
    status: 'draft' as const,
    items: [
      {
        id: '1',
        category: 'Imported', // Added category
        name: 'Washington Apple',
        sku: 'IMP-APP-001',
        quantity: 50,
        unitType: 'box',
        unitWeight: 20,
        totalWeight: 1000,
        unitPrice: 1500,
        total: 75000
      }
    ],
    additionalCosts: [
      { name: 'Labour Cost', amount: 5, type: 'per_box' as const },
      { name: 'Handling Cost', amount: 3, type: 'per_box' as const },
      { name: 'APMC Charge', amount: 1, type: 'percentage' as const },
      { name: 'Vehicle Charges', amount: 2000, type: 'fixed' as const }
    ],
    totalAmount: 75000
  };

  return <NewPurchaseOrder initialData={orderData} />;
};

export default EditPurchaseOrder;