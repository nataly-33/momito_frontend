import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/shared/components/layout/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";

// Auth Pages
import LoginPage from "@modules/auth/pages/LoginPage";
import RegisterPage from "@modules/auth/pages/RegisterPage";

// Public Pages
import { HomePage } from "@modules/products/pages/HomePage";
import { ProductsPage } from "@modules/products/pages/ProductsPage";
import { ProductDetailPage } from "@/modules/products/pages/ProductDetailPage";

// Protected Pages
import CartPage from "@/modules/cart/pages/CartPage";
import { CheckoutPage } from "@/modules/checkout/pages/CheckoutPage";
import ProfilePage from "@modules/customers/pages/ProfilePage";
import OrdersPage from "@modules/orders/pages/OrdersPage";
import OrderDetailPage from "@modules/orders/pages/OrderDetailPage";
import { FavoritesPage } from "@modules/customers/pages/FavoritesPage";

// Admin Pages
import { AdminDashboard } from "@/modules/admin/pages/AdminDashboard";
import { AdminDashboardOverview } from "@/modules/admin/pages/AdminDashboardOverview";
import { UsersManagement } from "@/modules/admin/pages/UsersManagment";
import { ProductsManagement } from "@/modules/admin/pages/ProductsManagement";
import { CategoriesManagement } from "@/modules/admin/pages/CategoriesManagement";
import { RolesManagement } from "@/modules/admin/pages/RolesManagment";
import { BrandsManagement } from "@/modules/admin/pages/BrandsManagement";
import { OrdersManagement } from "@/modules/admin/pages/OrdersManagement";
import { ShipmentsManagement } from "@/modules/admin/pages/ShipmentsManagement";
import { SettingsManagement } from "@/modules/admin/pages/SettingsManagement";
import AdminPredictions from "@/modules/admin/pages/AdminPredictions";
import { InventoryManagement } from "@/modules/admin/pages/InventoryManagement";
import { QuotesManagement } from "@/modules/admin/pages/QuotesManagement";
import { ClientsManagement } from "@/modules/admin/pages/ClientsManagement";

//Reports and Analytics
import { ReportsPage } from "@/modules/reports/pages/ReportsPage";
import { AnalyticsPage } from "@/modules/reports/pages/AnalyticsPage";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes (No Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />}>
            {/* Dashboard TUMOMITO como página por defecto */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardOverview />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="predictions" element={<AdminPredictions />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="roles" element={<RolesManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="brands" element={<BrandsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="shipments" element={<ShipmentsManagement />} />
            <Route path="settings" element={<SettingsManagement />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="quotes" element={<QuotesManagement />} />
            <Route path="clients" element={<ClientsManagement />} />
          </Route>
        </Route>

        {/* Public Routes (With Layout) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/new-arrivals" element={<ProductsPage />} />
          <Route path="/featured" element={<ProductsPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
