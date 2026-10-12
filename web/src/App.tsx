import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ShopPage from "./pages/ShopPage";
import OrdersPage from "./pages/OrdersPage";
import RoleRoute from "./components/RoleRoute";
import SearchPage from "./pages/SearchPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProductSearchPage from "./pages/ProductSearchPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ShopPage />} />
          <Route path="/orders" element={<OrdersPage />} />

          <Route element={<RoleRoute roles={["user"]} />}>
            <Route path="/product-search" element={<ProductSearchPage />} />
          </Route>

          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/products" element={<AdminProductsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
