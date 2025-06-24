import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SuperAdminAuthProvider } from './contexts/SuperAdminAuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { HashRouter as Router } from 'react-router-dom'

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import VehicleArrival from './pages/procurement/VehicleArrival';
import NewVehicleArrival from './pages/procurement/NewVehicleArrival';
import ViewVehicleArrival from './pages/procurement/ViewVehicleArrival';
import EditVehicleArrival from './pages/procurement/EditVehicleArrival';
import RecordPurchase from './pages/procurement/RecordPurchase';
import NewRecordPurchase from './pages/procurement/NewRecordPurchase';
import ViewRecordPurchase from './pages/procurement/ViewRecordPurchase';
import EditRecordPurchase from './pages/procurement/EditRecordPurchase';
import Inventory from './pages/inventory/Inventory';
import Sales from './pages/sales/Sales';
import NewSale from './pages/sales/NewSale';
import ViewSale from './pages/sales/ViewSale';
import EditSale from './pages/sales/EditSale';
import Dispatch from './pages/sales/Dispatch';
import Suppliers from './pages/partners/Suppliers';
import AddSupplier from './pages/partners/AddSupplier';
import ViewSupplier from './pages/partners/ViewSupplier';
import EditSupplier from './pages/partners/EditSupplier';
import Customers from './pages/partners/Customers';
import AddCustomer from './pages/partners/AddCustomer';
import ViewCustomer from './pages/partners/ViewCustomer';
import EditCustomer from './pages/partners/EditCustomer';
import Ledger from './pages/finance/Ledger';
import Payments from './pages/finance/Payments';
import Settings from './pages/settings/Settings';
import SuperAdmin from './pages/superadmin/SuperAdmin';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import Organizations from './pages/superadmin/Organizations';
import UserAccess from './pages/superadmin/UserAccess';
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

// SuperAdmin Auth Guard Component
const SuperAdminPrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('superadmin_auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/superadmin/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SuperAdminAuthProvider>
        <SidebarProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Regular User Routes */}
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
                <Route path="record-purchase" element={<RecordPurchase />} />
                <Route path="record-purchase/new" element={<NewRecordPurchase />} />
                <Route path="record-purchase/view/:id" element={<ViewRecordPurchase />} />
                <Route path="record-purchase/edit/:id" element={<EditRecordPurchase />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="sales/new" element={<NewSale />} />
                <Route path="sales/view/:id" element={<ViewSale />} />
                <Route path="sales/edit/:id" element={<EditSale />} />
                <Route path="dispatch" element={<Dispatch />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="suppliers/new" element={<AddSupplier />} />
                <Route path="suppliers/view/:id" element={<ViewSupplier />} />
                <Route path="suppliers/edit/:id" element={<EditSupplier />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/new" element={<AddCustomer />} />
                <Route path="customers/view/:id" element={<ViewCustomer />} />
                <Route path="customers/edit/:id" element={<EditCustomer />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="payments" element={<Payments />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* SuperAdmin Routes */}
              <Route path="/superadmin/login" element={<SuperAdminLogin />} />
              <Route 
                path="/superadmin" 
                element={
                  <SuperAdminPrivateRoute>
                    <SuperAdmin />
                  </SuperAdminPrivateRoute>
                } 
              />
              <Route 
                path="/superadmin/organizations" 
                element={
                  <SuperAdminPrivateRoute>
                    <Organizations />
                  </SuperAdminPrivateRoute>
                } 
              />
              <Route 
                path="/superadmin/user-access" 
                element={
                  <SuperAdminPrivateRoute>
                    <UserAccess />
                  </SuperAdminPrivateRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SidebarProvider>
      </SuperAdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
