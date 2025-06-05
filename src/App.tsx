import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import VehicleArrival from './pages/procurement/VehicleArrival';
import NewVehicleArrival from './pages/procurement/NewVehicleArrival';
import ViewVehicleArrival from './pages/procurement/ViewVehicleArrival';
import EditVehicleArrival from './pages/procurement/EditVehicleArrival';
import PurchaseOrders from './pages/procurement/PurchaseOrders';
import NewPurchaseOrder from './pages/procurement/NewPurchaseOrder';
import ViewPurchaseOrder from './pages/procurement/ViewPurchaseOrder';
import EditPurchaseOrder from './pages/procurement/EditPurchaseOrder';
import Inventory from './pages/inventory/Inventory';
import Sales from './pages/sales/Sales';
import Dispatch from './pages/sales/Dispatch';
import Suppliers from './pages/partners/Suppliers';
import AddSupplier from './pages/partners/AddSupplier';
import Customers from './pages/partners/Customers';
import Ledger from './pages/finance/Ledger';
import Payments from './pages/finance/Payments';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';

// Auth Guard Component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  // This is a placeholder for authentication logic
  // In a real app, you would check if the user is authenticated
  const isAuthenticated = localStorage.getItem('auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="vehicle-arrival" element={<VehicleArrival />} />
              <Route path="vehicle-arrival/new" element={<NewVehicleArrival />} />
              <Route path="vehicle-arrival/view/:id" element={<ViewVehicleArrival />} />
              <Route path="vehicle-arrival/edit/:id" element={<EditVehicleArrival />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="purchase-orders/new" element={<NewPurchaseOrder />} />
              <Route path="purchase-orders/view/:id" element={<ViewPurchaseOrder />} />
              <Route path="purchase-orders/edit/:id" element={<EditPurchaseOrder />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<Sales />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/new" element={<AddSupplier />} />
              <Route path="customers" element={<Customers />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="payments" element={<Payments />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;