import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ListingForm from "./pages/ListingForm.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Student Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <ListingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <ListingForm />
            </ProtectedRoute>
          }
        />

        {/* Friendly Redirects to Dashboard Tabs */}
        <Route path="/my-listings" element={<Navigate to="/dashboard?tab=listings" replace />} />
        <Route path="/wishlist" element={<Navigate to="/dashboard?tab=wishlist" replace />} />
        <Route path="/enquiries" element={<Navigate to="/dashboard?tab=enquiries" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard?tab=profile" replace />} />

        {/* Administrator Role-Guarded Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
