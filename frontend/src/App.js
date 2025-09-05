import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StoreProfile from './pages/StoreProfile';
import StaffManagement from './pages/StaffManagement';
import StoreCustomization from './pages/StoreCustomization';
import WhatsApp from './pages/WhatsApp';
import Subscribe from './pages/Subscribe';
import Subscription from './pages/Subscription';
import StockTake from './pages/StockTake';
import StockTakeDetail from './pages/StockTakeDetail';
import Credit from './pages/Credit';
import Billing from './pages/Billing';
import PaymentCallback from './pages/PaymentCallback';
import PaymentTest from './pages/PaymentTest';
import Layout from './components/Layout';
import PWAInstaller from './components/PWAInstaller';
import OfflineIndicator from './components/OfflineIndicator';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  // Register service worker
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/*" element={<PaymentCallback />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute>
            <Layout>
              <POS />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <Layout>
              <Sales />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <Layout>
              <Invoices />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <StoreProfile />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute>
            <Layout>
              <StaffManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customize" element={
          <ProtectedRoute>
            <Layout>
              <StoreCustomization />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/whatsapp" element={
          <ProtectedRoute>
            <Layout>
              <WhatsApp />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/subscription" element={
          <ProtectedRoute>
            <Layout>
              <Subscription />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stock-take" element={
          <ProtectedRoute>
            <Layout>
              <StockTake />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stock-take/:id" element={
          <ProtectedRoute>
            <Layout>
              <StockTakeDetail />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/credit" element={
          <ProtectedRoute>
            <Layout>
              <Credit />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <Layout>
              <Billing />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      <PWAInstaller />
      <OfflineIndicator />
    </Router>
  );
}

export default App;